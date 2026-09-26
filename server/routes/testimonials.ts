import { RequestHandler } from "express";
import { escapeHtml } from "../lib/sanitize";
import { prisma } from "../db";
import { testimonialSchema, formatZodError } from "../lib/validation";

export const submitTestimonial: RequestHandler = async (req, res) => {
  try {
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
    }
    const { name, email, company, projectName, rating, message } = parsed.data;

    await prisma.testimonial.create({
      data: {
        name: escapeHtml(name),
        email,
        company: company ? escapeHtml(company) : null,
        projectName: projectName ? escapeHtml(projectName) : null,
        rating,
        message: escapeHtml(message),
        status: "pending",
      },
    });

    res.json({
      success: true,
      message: "Thanks! Your review has been submitted and will appear once reviewed.",
    });
  } catch (error) {
    console.error("submitTestimonial error:", error);
    res.status(500).json({ success: false, message: "Failed to submit review" });
  }
};

// Public
export const listApprovedTestimonials: RequestHandler = async (_req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        company: true,
        projectName: true,
        rating: true,
        message: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: testimonials });
  } catch (error) {
    console.error("listApprovedTestimonials error:", error);
    res.status(500).json({ success: false, message: "Failed to load reviews" });
  }
};
