import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma, BlogRevision } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { redisClient } from '../config/redis.js';
import { queueNewBlogBroadcast } from '../config/queues.js';

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${base}-${Date.now().toString().slice(-4)}`;
}

function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

const blogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters long'),
  content: z.string().min(20, 'Content must be at least 20 characters long'),
  bannerImage: z.string().optional(),
  category: z.string().default('Engineering'),
  tags: z.array(z.string()).default(['Code', 'Coffee']),
  isPublished: z.boolean().default(true),
});

export class BlogController {
  // Public: List all published blogs (or all if admin requested)
  static async getAllBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const search = (req.query.search as string) || '';
      const category = (req.query.category as string) || '';
      const tag = (req.query.tag as string) || '';
      const includeDrafts = req.query.includeDrafts === 'true';

      const skip = (page - 1) * limit;

      const where: any = {};
      if (!includeDrafts) {
        where.isPublished = true;
      }

      if (category && category !== 'All') {
        where.category = { equals: category, mode: 'insensitive' };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (tag) {
        where.tags = { has: tag };
      }

      const [blogs, total] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, avatar: true, role: true } },
            _count: { select: { likes: true, dislikes: true, comments: true } },
          },
        }),
        prisma.post.count({ where }),
      ]);

      // Enrich with live active reader count from Redis
      const enrichedBlogs = await Promise.all(
        blogs.map(async (blog) => {
          const activeKeys = await redisClient.keys(`blog:reader:${blog.id}:*`);
          return {
            ...blog,
            activeReaders: activeKeys.length,
            likesCount: blog._count.likes,
            dislikesCount: blog._count.dislikes,
            commentsCount: blog._count.comments,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          blogs: enrichedBlogs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Public: Read full blog by slug
  static async getBlogBySlug(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const slug = String(req.params.slug);
      const blog = await prisma.post.findUnique({
        where: { slug },
        include: {
          author: { select: { id: true, name: true, avatar: true, bio: true, role: true } },
          _count: { select: { likes: true, dislikes: true, comments: true } },
        },
      });

      if (!blog) {
        res.status(404).json({ success: false, message: 'Blog post not found.' });
        return;
      }

      // Check if user has liked or disliked (if authenticated)
      let userLiked = false;
      let userDisliked = false;

      if (req.user) {
        const [like, dislike] = await Promise.all([
          prisma.like.findUnique({
            where: { userId_postId: { userId: req.user.id, postId: blog.id } },
          }),
          prisma.dislike.findUnique({
            where: { userId_postId: { userId: req.user.id, postId: blog.id } },
          }),
        ]);
        userLiked = !!like;
        userDisliked = !!dislike;
      }

      // Increment views count asynchronously
      prisma.post
        .update({
          where: { id: blog.id },
          data: { views: { increment: 1 } },
        })
        .catch((e) => console.warn('Views increment error:', e.message));

      // Active readers for this blog
      const activeKeys = await redisClient.keys(`blog:reader:${blog.id}:*`);

      res.status(200).json({
        success: true,
        data: {
          ...blog,
          activeReaders: activeKeys.length,
          likesCount: blog._count.likes,
          dislikesCount: blog._count.dislikes,
          commentsCount: blog._count.comments,
          userLiked,
          userDisliked,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // ADMIN & CONTRIBUTOR: Create Blog
  static async createBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'CONTRIBUTOR')) {
        res.status(403).json({ success: false, message: 'Only administrators and authorized contributors can create blog articles.' });
        return;
      }

      const data = blogSchema.parse(req.body);
      const slug = generateSlug(data.title);
      const readingTime = calculateReadingTime(data.content);

      // Save revision to MongoDB Atlas
      let mongoDocId: string | undefined = undefined;
      try {
        const revision = new BlogRevision({
          blogSlug: slug,
          authorEmail: req.user.email,
          title: data.title,
          contentMarkdown: data.content,
          metaTags: data.tags,
          revisionNumber: 1,
        });
        const savedRev = await revision.save();
        mongoDocId = savedRev._id.toString();
      } catch (mongoErr) {
        console.warn('MongoDB Atlas revision save notice:', (mongoErr as Error).message);
      }

      const post = await prisma.post.create({
        data: {
          title: data.title,
          slug,
          excerpt: data.excerpt,
          content: data.content,
          bannerImage: data.bannerImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
          readingTime,
          category: data.category,
          tags: data.tags,
          isPublished: data.isPublished,
          authorId: req.user.id,
          mongoDocId,
        },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { likes: true, dislikes: true, comments: true } },
        },
      });

      // Broadcast new blog notification email to all registered users if published
      if (post.isPublished) {
        queueNewBlogBroadcast({
          title: post.title,
          excerpt: post.excerpt,
          slug: post.slug,
          category: post.category,
          bannerImage: post.bannerImage,
          authorName: post.author.name,
          readingTime: post.readingTime,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Blog post created successfully.',
        data: {
          ...post,
          activeReaders: 0,
          likesCount: post._count.likes,
          dislikesCount: post._count.dislikes,
          commentsCount: post._count.comments,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // ADMIN & CONTRIBUTOR: Update Blog
  static async updateBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'CONTRIBUTOR')) {
        res.status(403).json({ success: false, message: 'Only administrators and authorized contributors can modify blog articles.' });
        return;
      }

      const id = String(req.params.id);
      const data = blogSchema.partial().parse(req.body);

      const existing = await prisma.post.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Blog post not found.' });
        return;
      }

      // Contributors can only modify their own articles
      if (req.user.role === 'CONTRIBUTOR' && existing.authorId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Access denied: Contributors can only modify their own articles.' });
        return;
      }

      const readingTime = data.content ? calculateReadingTime(data.content) : existing.readingTime;

      // Save revision to MongoDB Atlas
      try {
        const count = await BlogRevision.countDocuments({ blogSlug: existing.slug });
        const revision = new BlogRevision({
          blogSlug: existing.slug,
          authorEmail: req.user.email,
          title: data.title || existing.title,
          contentMarkdown: data.content || existing.content,
          metaTags: data.tags || existing.tags,
          revisionNumber: count + 1,
        });
        await revision.save();
      } catch (mongoErr) {
        console.warn('MongoDB Atlas revision update notice:', (mongoErr as Error).message);
      }

      const updated = await prisma.post.update({
        where: { id },
        data: {
          ...data,
          readingTime,
        },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { likes: true, dislikes: true, comments: true } },
        },
      });

      // If post was unpublished and now is published, notify users
      if (!existing.isPublished && updated.isPublished) {
        queueNewBlogBroadcast({
          title: updated.title,
          excerpt: updated.excerpt,
          slug: updated.slug,
          category: updated.category,
          bannerImage: updated.bannerImage,
          authorName: updated.author.name,
          readingTime: updated.readingTime,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Blog post updated successfully.',
        data: {
          ...updated,
          likesCount: updated._count.likes,
          dislikesCount: updated._count.dislikes,
          commentsCount: updated._count.comments,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // ADMIN & CONTRIBUTOR: Delete Blog
  static async deleteBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'CONTRIBUTOR')) {
        res.status(403).json({ success: false, message: 'Only administrators and authorized contributors can delete blogs.' });
        return;
      }

      const id = String(req.params.id);
      const existing = await prisma.post.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Blog post not found.' });
        return;
      }

      // Contributors can only delete their own articles
      if (req.user.role === 'CONTRIBUTOR' && existing.authorId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Access denied: Contributors can only delete their own articles.' });
        return;
      }

      await prisma.post.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: 'Blog post deleted permanently.',
      });
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: Toggle Like
  static async toggleLike(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required to like.' });
        return;
      }

      const id = String(req.params.id);
      const userId = req.user.id;

      const existingLike = await prisma.like.findUnique({
        where: { userId_postId: { userId, postId: id } },
      });

      if (existingLike) {
        // Remove like
        await prisma.like.delete({
          where: { userId_postId: { userId, postId: id } },
        });
      } else {
        // Add like and remove dislike if exists
        await prisma.$transaction([
          prisma.like.create({
            data: { userId, postId: id },
          }),
          prisma.dislike.deleteMany({
            where: { userId, postId: id },
          }),
        ]);
      }

      const [likesCount, dislikesCount] = await Promise.all([
        prisma.like.count({ where: { postId: id } }),
        prisma.dislike.count({ where: { postId: id } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          userLiked: !existingLike,
          userDisliked: false,
          likesCount,
          dislikesCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Authenticated User: Toggle Dislike
  static async toggleDislike(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required to dislike.' });
        return;
      }

      const id = String(req.params.id);
      const userId = req.user.id;

      const existingDislike = await prisma.dislike.findUnique({
        where: { userId_postId: { userId, postId: id } },
      });

      if (existingDislike) {
        // Remove dislike
        await prisma.dislike.delete({
          where: { userId_postId: { userId, postId: id } },
        });
      } else {
        // Add dislike and remove like if exists
        await prisma.$transaction([
          prisma.dislike.create({
            data: { userId, postId: id },
          }),
          prisma.like.deleteMany({
            where: { userId, postId: id },
          }),
        ]);
      }

      const [likesCount, dislikesCount] = await Promise.all([
        prisma.like.count({ where: { postId: id } }),
        prisma.dislike.count({ where: { postId: id } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          userLiked: false,
          userDisliked: !existingDislike,
          likesCount,
          dislikesCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
