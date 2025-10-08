# 🚀 ContabilPRO - Quick Start

## ⚡ Get Started in 3 Steps

### 1️⃣ Configure Environment
```bash
cp .env.local.example .env.local
# Edit .env.local and add your Supabase credentials
```

### 2️⃣ Setup Database
```bash
npx supabase link --project-ref hszvovnfskuumwmvjqnm
npx supabase db push
```

### 3️⃣ Start Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📋 Essential Commands

### Development
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run type-check   # TypeScript type checking
```

### Supabase
```bash
npx supabase start   # Start local Supabase
npx supabase stop    # Stop local Supabase
npx supabase db push # Push migrations to remote
npx supabase db reset # Reset local database
```

---

## 🔑 Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: **hszvovnfskuumwmvjqnm**
3. Settings > API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📁 Key Files

- `src/app/` - Next.js pages
- `src/components/ui/` - Shadcn/ui components
- `src/lib/supabase/` - Supabase clients
- `src/stores/` - Zustand stores
- `src/hooks/` - Custom hooks
- `supabase/migrations/` - Database migrations

---

## 🎯 Current Phase

**Phase 0: Foundation** ✅ COMPLETE

**Next: Phase 1 - MVP** 🎯

---

## 📚 Full Documentation

- [INSTALLATION_COMPLETE.md](./INSTALLATION_COMPLETE.md) - Complete setup details
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [README.md](./README.md) - Project overview

---

**Ready to code! 🚀**

