import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(120).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    const prisma = getPrisma();
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const passwordHash = await bcrypt.hash(password, 12);

    if (existing) {
      if (existing.passwordHash) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }

      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          name: name ?? existing.name,
        },
      });

      return NextResponse.json({ ok: true }, { status: 201 });
    }

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const message = err.errors.map((issue) => issue.message).join(" ");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Registration error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
