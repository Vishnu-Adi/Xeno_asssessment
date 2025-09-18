import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { getPrisma } from './db'
import bcrypt from 'bcryptjs'

const prisma = getPrisma()

const isEmailConfigured = process.env.EMAIL_SERVER_HOST && 
  process.env.EMAIL_SERVER_PORT && 
  process.env.EMAIL_SERVER_USER && 
  process.env.EMAIL_SERVER_PASSWORD && 
  process.env.EMAIL_FROM

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  providers: [

    ...(isEmailConfigured ? [EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })] : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.trim().toLowerCase()
        const plainPassword = credentials.password

        if (email === 'demo@example.com' && plainPassword === 'demo123') {
          const demoUser = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
              email,
              name: 'Demo User',
            },
          })

          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name || 'Demo User',
          }
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user?.passwordHash) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(plainPassword, user.passwordHash)
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session?.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}
