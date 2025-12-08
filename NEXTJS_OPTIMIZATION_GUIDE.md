# Next.js Optimization Guide - Chi tiết từng bước

## 📊 Phân tích hiện trạng

### Cấu trúc hiện tại:
- ✅ Next.js 15.5.4 với App Router
- ✅ Turbopack enabled
- ✅ TypeScript
- ✅ Font optimization (next/font/google)
- ❌ **Tất cả components đều là Client Components** (`"use client"`)
- ❌ **Routing bằng client-side state** (không dùng Next.js routing)
- ❌ **Không có Server Components**
- ❌ **Không có API Routes**
- ❌ **Không có Image Optimization** (next/image)
- ❌ **React Query có nhưng chưa dùng**
- ❌ **Không có Middleware**

### Routing hiện tại:
```typescript
// ❌ HIỆN TẠI - Client-side routing
const [activeView, setActiveView] = useState("dashboard")
switch (activeView) {
  case "dashboard": return <HRDashboard />
  case "employees": return <EmployeeManagement />
  // ...
}
```

### Components:
- Tất cả 69 components đều có `"use client"`
- Data fetching đều từ client-side (useEffect + axios)
- Không có Server Components

---

## 🎯 Optimization Opportunities (theo priority)

### Priority 1: Image Optimization ⭐⭐⭐ (High Impact, Low Risk)

**Impact:** Giảm 20-40% image loading time  
**Risk:** Thấp  
**Effort:** 1-2 giờ

#### Bước 1.1: Tìm tất cả images
```bash
# Tìm tất cả <img> tags
grep -r "<img" frontend/src/components
```

#### Bước 1.2: Thay thế từng image

**Case 1: Avatar Component (đã dùng Radix UI)**
```typescript
// components/ui/avatar.tsx - KHÔNG CẦN THAY ĐỔI
// Radix UI Avatar đã handle image optimization
// Chỉ cần đảm bảo src URL đúng format
```

**Case 2: Custom Image với getImageUrl**
```typescript
// ❌ TRƯỚC
import { getImageUrl } from '@/lib/utils/image'
<img src={getImageUrl(employee.avatar)} alt={employee.name} />

// ✅ SAU
import Image from 'next/image'
import { getImageUrl } from '@/lib/utils/image'

<Image 
  src={getImageUrl(employee.avatar) || '/default-avatar.png'} 
  alt={employee.name}
  width={40}
  height={40}
  className="rounded-full"
  onError={(e) => {
    e.currentTarget.src = '/default-avatar.png'
  }}
/>
```

**Case 3: Image với dynamic sizing**
```typescript
// ✅ Sử dụng fill với relative parent
<div className="relative w-full h-64">
  <Image
    src={imageUrl}
    alt="Description"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>
```

#### Bước 1.3: Configure next.config.js
```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-image-domain.com',
      },
    ],
  },
}
```

**Lưu ý:**
- ⚠️ Phải có `width` và `height` (hoặc `fill` với `relative` parent)
- ⚠️ External images cần config trong `next.config.js`
- ⚠️ Test với các kích thước khác nhau

**Files cần check:**
- `components/figma/ImageWithFallback.tsx` - Có thể update để dùng next/image
- `components/employee-detail-modal.tsx` - Check có dùng getImageUrl không
- `components/employee-management.tsx` - Check avatar usage
- `components/hr-header.tsx` - Check avatar usage
- Bất kỳ component nào có `<img>` tag

**Lưu ý đặc biệt:**
- Avatar component dùng Radix UI - KHÔNG CẦN thay đổi
- getImageUrl() helper vẫn hoạt động với next/image
- Cần handle fallback images properly

**Update ImageWithFallback component:**

```typescript
// components/figma/ImageWithFallback.tsx
"use client"
import Image from 'next/image'
import { useState } from 'react'

const ERROR_IMG_SRC = '/default-image.png' // Hoặc data URL

export function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className,
  ...props
}: {
  src?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
}) {
  const [imgSrc, setImgSrc] = useState(src || ERROR_IMG_SRC)
  const [hasError, setHasError] = useState(false)

  if (!width || !height) {
    // Fallback to regular img if no dimensions
    return (
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        onError={() => {
          if (!hasError) {
            setHasError(true)
            setImgSrc(ERROR_IMG_SRC)
          }
        }}
        {...props}
      />
    )
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (!hasError) {
          setHasError(true)
          setImgSrc(ERROR_IMG_SRC)
        }
      }}
      {...props}
    />
  )
}
```

---

### Priority 2: Server Components ⭐⭐⭐ (High Impact, Medium Risk)

**Impact:** Giảm 30-50% JavaScript bundle, cải thiện SEO  
**Risk:** Trung bình (cần test kỹ)  
**Effort:** 2-3 ngày

#### Phase 2.1: Tách Server/Client Components (1 ngày)

**Bước 2.1.1: Tạo Server Component wrapper cho Dashboard**

```typescript
// app/dashboard/page.tsx (Server Component - KHÔNG có "use client")
import { getDashboardData } from '@/app/actions/dashboard'
import { HRDashboardClient } from '@/components/hr-dashboard-client'

export default async function DashboardPage() {
  // Fetch data ở server
  const initialData = await getDashboardData()
  
  return <HRDashboardClient initialData={initialData} />
}
```

**⚠️ Lưu ý:**
- Page component là Server Component mặc định
- Không cần `"use server"` ở page.tsx
- Có thể async và await data fetching
- Pass data xuống Client Component qua props

```typescript
// components/hr-dashboard-client.tsx (Client Component)
"use client"
import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { HRDashboard } from './hr-dashboard' // Component hiện tại

interface DashboardInitialData {
  attendance: any[]
  leave: any[]
  payroll: any
  employees: any[]
}

export function HRDashboardClient({ 
  initialData 
}: { 
  initialData: DashboardInitialData 
}) {
  // Chỉ phần interactive ở đây
  const [attendanceRange, setAttendanceRange] = useState("7")
  
  // Tính toán dates dựa trên range
  const today = new Date()
  const endDate = format(today, "yyyy-MM-dd")
  const startDate = format(subDays(today, Number(attendanceRange) - 1), "yyyy-MM-dd")
  
  // Filter initialData dựa trên date range
  const filteredAttendance = initialData.attendance.filter(record => {
    const recordDate = record.attendanceDate
    return recordDate >= startDate && recordDate <= endDate
  })
  
  return (
    <HRDashboard 
      initialAttendance={filteredAttendance}
      initialLeave={initialData.leave}
      initialPayroll={initialData.payroll}
      initialEmployees={initialData.employees}
      attendanceRange={attendanceRange}
      onRangeChange={setAttendanceRange}
    />
  )
}
```

**⚠️ Lưu ý:**
- Client Component nhận initialData từ Server Component
- Có thể refetch data nếu cần (dùng React Query hoặc useEffect)
- Tách logic interactive (state, handlers) vào Client Component
- Pass data và callbacks qua props

**Lưu ý:**
- ⚠️ Server Components KHÔNG thể dùng hooks (useState, useEffect)
- ⚠️ Server Components KHÔNG thể dùng browser APIs
- ⚠️ Server Components có thể async và fetch data trực tiếp
- ⚠️ Chỉ tách phần cần interactivity thành Client Component

**Bước 2.1.2: Tạo Server Actions cho data fetching**

```typescript
// app/actions/dashboard.ts
"use server"

export async function getDashboardData() {
  // Fetch từ backend
  const response = await fetch(`${API_URL}/api/dashboard`, {
    headers: {
      'Authorization': `Bearer ${await getToken()}`,
    },
  })
  return response.json()
}
```

**Lưu ý:**
- ⚠️ Server Actions phải có `"use server"`
- ⚠️ Không thể pass functions từ Server Actions
- ⚠️ Cần handle errors properly

**Bước 2.1.3: Migrate từng component**

**Thứ tự ưu tiên (theo độ phức tạp):**

1. **`DepartmentManagement`** - Đơn giản nhất
   - Chủ yếu là list view
   - Ít interactive
   - Dễ tách Server/Client

2. **`EmployeeManagement`** - Trung bình
   - List view với search/filter
   - Có forms (cần Client Component)
   - Pagination

3. **`HRDashboard`** - Phức tạp hơn
   - Nhiều data sources
   - Charts và visualizations
   - Date range filtering

4. **`AttendanceManagement`** - Phức tạp nhất
   - Nhiều interactive components
   - Calendar views
   - Real-time updates
   - Để sau cùng

**Checklist cho mỗi component:**

**Phase 1: Preparation**
- [ ] Backup component hiện tại
- [ ] Identify data fetching logic
- [ ] Identify interactive parts (state, handlers)
- [ ] List all dependencies

**Phase 2: Server Action**
- [ ] Tạo Server Action cho data fetching
- [ ] Handle errors properly
- [ ] Return default values
- [ ] Test Server Action độc lập

**Phase 3: Component Split**
- [ ] Tạo Client Component với initialData prop
- [ ] Move interactive logic vào Client Component
- [ ] Keep rendering logic
- [ ] Test với mock data

**Phase 4: Integration**
- [ ] Tạo page.tsx (Server Component)
- [ ] Call Server Action
- [ ] Pass data xuống Client Component
- [ ] Test end-to-end

**Phase 5: Testing**
- [ ] Test với real data
- [ ] Test loading states
- [ ] Test error states
- [ ] Test với different user roles
- [ ] Verify bundle size giảm

#### Phase 2.2: Implement Next.js Routing (1 ngày)

**Bước 2.2.1: Tạo route structure**

```
app/
  layout.tsx          # Root layout (giữ nguyên)
  page.tsx            # Home/Login page (giữ nguyên)
  dashboard/
    page.tsx          # Dashboard page (Server Component)
  employees/
    page.tsx          # Employees page (Server Component)
  departments/
    page.tsx          # Departments page (Server Component)
  attendance/
    page.tsx          # Attendance page (Server Component)
  leave/
    page.tsx          # Leave page (Server Component)
  payroll/
    page.tsx          # Payroll page (Server Component)
  reports/
    page.tsx          # Reports page (Server Component)
  audit/
    page.tsx          # Audit page (Server Component)
```

**⚠️ Lưu ý:**
- Mỗi route là một folder với `page.tsx` bên trong
- `page.tsx` là Server Component mặc định
- Có thể tạo `layout.tsx` cho mỗi route nếu cần shared layout
- `loading.tsx` và `error.tsx` cho loading/error states

**Bước 2.2.2: Migrate từ client routing**

**Step 1: Update app/page.tsx (giữ cho login)**

```typescript
// app/page.tsx - Chỉ handle login, redirect nếu authenticated
"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/components/login-page'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])
  
  if (isAuthenticated) {
    return null // Will redirect
  }
  
  return <LoginPage onLogin={() => router.push('/dashboard')} />
}
```

**Step 2: Tạo dashboard route**

```typescript
// app/dashboard/page.tsx
import { getDashboardData } from '@/app/actions/dashboard'
import { HRDashboardClient } from '@/components/hr-dashboard-client'

export default async function DashboardPage() {
  const initialData = await getDashboardData()
  
  return <HRDashboardClient initialData={initialData} />
}
```

**Step 3: Tạo shared layout cho authenticated routes**

```typescript
// app/(authenticated)/layout.tsx
import { HRSidebar } from '@/components/hr-sidebar'
import { HRHeader } from '@/components/hr-header'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg z-10">
          <HRSidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <HRHeader />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Move routes vào (authenticated) group**

```
app/
  (authenticated)/     # Route group (không ảnh hưởng URL)
    dashboard/
      page.tsx
    employees/
      page.tsx
    ...
```

**⚠️ Lưu ý:**
- Route groups `(authenticated)` không ảnh hưởng URL
- Có thể share layout cho tất cả routes trong group
- Cần update sidebar để dùng Next.js Link

**Lưu ý:**
- ⚠️ Cần update sidebar navigation để dùng Next.js Link
- ⚠️ Cần update active state dựa trên pathname
- ⚠️ Cần handle authentication redirects

**Bước 2.2.3: Update navigation**

```typescript
// components/hr-sidebar.tsx
"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Building2, ... } from 'lucide-react'

export function HRSidebar() {
  const pathname = usePathname()
  
  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employees', label: 'Nhân viên', icon: Users },
    { href: '/departments', label: 'Phòng ban', icon: Building2 },
    // ...
  ]
  
  return (
    <nav className="p-4 space-y-2">
      {menuItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/dashboard' && pathname?.startsWith(item.href))
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
              isActive 
                ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

**⚠️ Lưu ý:**
- `usePathname()` chỉ hoạt động trong Client Component
- Cần handle active state cho nested routes
- Có thể dùng `useRouter()` để programmatic navigation
- Link component tự handle prefetching

#### Phase 2.3: Testing & Refinement (1 ngày)

**Checklist:**
- [ ] Test tất cả routes
- [ ] Test navigation
- [ ] Test data fetching
- [ ] Test error handling
- [ ] Test loading states
- [ ] Verify bundle size giảm
- [ ] Test SEO (meta tags)

---

### Priority 3: React Query Integration ⭐⭐ (Medium Impact, Low Risk)

**Impact:** Cải thiện caching, background refetching  
**Risk:** Thấp  
**Effort:** 1 ngày

#### Bước 3.1: Setup React Query Provider

```typescript
// app/providers.tsx
"use client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

#### Bước 3.2: Migrate data fetching

```typescript
// ❌ TRƯỚC
useEffect(() => {
  const fetchData = async () => {
    const data = await employeeAPI.getAllEmployees()
    setEmployees(data)
  }
  fetchData()
}, [])

// ✅ SAU
import { useQuery } from '@tanstack/react-query'

const { data: employees, isLoading, error } = useQuery({
  queryKey: ['employees', page, size, keyword],
  queryFn: () => employeeAPI.getAllEmployees(page, size, keyword),
  staleTime: 60 * 1000,
})
```

**Lưu ý:**
- ⚠️ Query keys phải unique và include dependencies
- ⚠️ Handle loading và error states
- ⚠️ Có thể combine với Server Components

#### Bước 3.3: Implement mutations

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const createMutation = useMutation({
  mutationFn: employeeAPI.createEmployee,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['employees'] })
  },
})
```

**Lưu ý:**
- ⚠️ Invalidate queries sau mutations
- ⚠️ Handle optimistic updates nếu cần
- ⚠️ Error handling trong onError

---

### Priority 4: Middleware & Route Protection ⭐⭐ (Medium Impact, Medium Risk)

**Impact:** Better security, automatic redirects  
**Risk:** Trung bình  
**Effort:** 0.5 ngày

#### Bước 4.1: Tạo middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/employees', '/departments', ...]
const publicRoutes = ['/', '/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('accessToken')?.value

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublic = publicRoutes.some(route => pathname === route)

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**Lưu ý:**
- ⚠️ Middleware chạy trên Edge Runtime
- ⚠️ Không thể dùng Node.js APIs
- ⚠️ Cookies phải được set từ Server Actions hoặc API routes
- ⚠️ Test với các routes khác nhau

---

### Priority 5: API Routes (Optional) ⭐ (Low Priority, High Risk)

**Impact:** Caching, security, rate limiting  
**Risk:** Cao (đã gặp nhiều lỗi)  
**Effort:** 2-3 ngày

**⚠️ CHỈ implement nếu thực sự cần:**
- Caching ở Next.js layer
- Rate limiting
- Request transformation
- Security headers

**Nếu implement, follow checklist:**
- [ ] Đảm bảo token sync giữa localStorage và cookies
- [ ] Test error handling với các error codes
- [ ] Test với các user roles
- [ ] Monitor performance

---

## 📋 Implementation Plan (Chi tiết từng bước)

### Week 1: Quick Wins (Low Risk)

#### Day 1: Image Optimization
- [ ] Tìm tất cả `<img>` tags
- [ ] Thay thế bằng `next/image`
- [ ] Configure `next.config.js`
- [ ] Test với các kích thước khác nhau
- [ ] Verify performance improvement

**Expected Result:** 20-40% faster image loading

#### Day 2: React Query Setup
- [ ] Setup QueryClientProvider
- [ ] Migrate 1-2 components để test
- [ ] Implement basic caching
- [ ] Test với different scenarios

**Expected Result:** Better caching, background refetching

### Week 2: Server Components (Medium Risk)

#### Day 3-4: Tách Server/Client Components
- [ ] Tạo Server Component cho Dashboard
- [ ] Tách Client Component cho interactive parts
- [ ] Tạo Server Actions cho data fetching
- [ ] Test với initial data
- [ ] Verify bundle size giảm

**Expected Result:** 30-50% smaller bundle size

#### Day 5: Next.js Routing
- [ ] Tạo route structure
- [ ] Migrate từ client routing
- [ ] Update navigation
- [ ] Test tất cả routes

**Expected Result:** Better SEO, faster navigation

### Week 3: Refinement & Testing

#### Day 6-7: Testing & Optimization
- [ ] Test tất cả features
- [ ] Performance testing
- [ ] Fix any issues
- [ ] Documentation

---

## ⚠️ Common Issues & Solutions

### Issue 1: Hydration Mismatch

**Symptom:** Warning về hydration mismatch

**Causes:**
- Server và Client render khác nhau
- Dùng `window` hoặc `localStorage` trong Server Component
- Date/time formatting khác nhau

**Solution:**
```typescript
// ✅ Sử dụng useEffect để chỉ chạy trên client
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return <Loading />
}
```

### Issue 2: Token không có trong cookies

**Symptom:** API routes trả về 403

**Solution:**
- Đảm bảo token được sync vào cookies sau login
- Test với `/api/test-auth` endpoint
- Kiểm tra cookies trong DevTools

### Issue 3: Server Component không thể dùng hooks

**Symptom:** Error "useState is not defined"

**Solution:**
- Tách phần cần hooks thành Client Component
- Pass data từ Server Component xuống Client Component

### Issue 4: Next.js routing không hoạt động

**Symptom:** 404 errors

**Causes:**
- File structure sai
- Middleware block routes
- Route groups syntax sai

**Solution:**
```typescript
// ✅ ĐÚNG - app/dashboard/page.tsx
export default function DashboardPage() { ... }

// ❌ SAI - app/dashboard.tsx (thiếu page.tsx)
// ❌ SAI - app/dashboard/index.tsx (phải là page.tsx)
```

**Checklist:**
- [ ] File phải tên `page.tsx` (không phải `index.tsx`)
- [ ] Folder structure đúng: `app/route/page.tsx`
- [ ] Route groups: `app/(group)/route/page.tsx`
- [ ] Middleware không block route
- [ ] Check browser console cho errors

### Issue 5: Server Component không thể pass functions

**Symptom:** Error "Functions cannot be passed to Client Components"

**Solution:**
```typescript
// ❌ SAI
<ClientComponent onClick={() => {}} />

// ✅ ĐÚNG - Pass data, handle trong Client Component
<ClientComponent data={data} />
// Trong Client Component:
const handleClick = () => { ... }
```

### Issue 6: Hydration với dates/times

**Symptom:** Date formatting khác nhau giữa server và client

**Solution:**
```typescript
// ✅ Format date trong Client Component
"use client"
import { format } from 'date-fns'

export function DateDisplay({ date }: { date: string }) {
  // Format trong client để tránh timezone issues
  return <span>{format(new Date(date), 'dd/MM/yyyy')}</span>
}
```

---

## ✅ Testing Checklist

### Pre-Implementation:
- [ ] Backup code (git commit)
- [ ] Document current performance
- [ ] Identify bottlenecks

### During Implementation:
- [ ] Test sau mỗi thay đổi nhỏ
- [ ] Test với different browsers
- [ ] Test với different screen sizes
- [ ] Test error scenarios

### Post-Implementation:
- [ ] Test tất cả features
- [ ] Performance testing
- [ ] SEO testing
- [ ] Accessibility testing

---

## 📊 Success Metrics

### Performance:
- Bundle size giảm 30-50%
- First Contentful Paint (FCP) giảm 20-30%
- Time to Interactive (TTI) giảm 20-30%
- Image loading time giảm 20-40%

### Developer Experience:
- Code dễ maintain hơn
- Better error handling
- Better caching strategy

---

## 🎯 Recommended Order

1. **Image Optimization** (1-2 giờ) - Quick win, low risk
2. **React Query** (1 ngày) - Better caching, low risk
3. **Server Components** (2-3 ngày) - High impact, medium risk
4. **Next.js Routing** (1 ngày) - Better SEO, medium risk
5. **Middleware** (0.5 ngày) - Security, medium risk
6. **API Routes** (Optional) - Only if needed, high risk

---

## 📝 Notes

- **Không rush:** Làm từng bước một, test kỹ
- **Backup thường xuyên:** Commit sau mỗi bước
- **Test kỹ:** Đặc biệt là token sync và error handling
- **Document changes:** Ghi lại những gì đã làm
- **Start small:** Bắt đầu với component đơn giản nhất
- **Incremental:** Migrate từng component một, không làm tất cả cùng lúc

## 🔍 Debugging Tips

### Check Server vs Client Components
```typescript
// Thêm vào component để check
console.log('Rendering on:', typeof window === 'undefined' ? 'server' : 'client')
```

### Check Bundle Size
```bash
npm run build
# Check .next/analyze/ hoặc dùng @next/bundle-analyzer
```

### Check Network Requests
- DevTools → Network tab
- Filter by "Fetch/XHR"
- Check if requests từ server (SSR) hay client

### Check Hydration Issues
- DevTools → Console
- Look for hydration warnings
- Check for mismatched HTML

---

## 📚 Additional Resources

- [Next.js Server Components Docs](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [React Query Docs](https://tanstack.com/query/latest)
- [Next.js Routing](https://nextjs.org/docs/app/building-your-application/routing)

---

---

## 📦 Files Summary - Tổng hợp files cần thay đổi

### Phase 1: Image Optimization
**Files cần update:**
- `components/figma/ImageWithFallback.tsx` - Update để support next/image
- `components/employee-detail-modal.tsx` - Check avatar images
- `components/employee-management.tsx` - Check avatar images
- `components/hr-header.tsx` - Check avatar images
- `next.config.js` - Add image configuration (nếu chưa có)

**Files mới:**
- Không có

**Estimated changes:** 3-5 files

---

### Phase 2: React Query
**Files cần update:**
- `app/layout.tsx` - Add Providers wrapper
- `components/hr-dashboard.tsx` - Migrate to useQuery
- `components/employee-management.tsx` - Migrate to useQuery
- `components/department-management.tsx` - Migrate to useQuery

**Files mới:**
- `app/providers.tsx` - QueryClientProvider

**Estimated changes:** 4-5 files

---

### Phase 3: Server Components
**Files cần update:**
- `components/hr-dashboard.tsx` - Split into Server/Client
- `components/employee-management.tsx` - Split into Server/Client
- `components/department-management.tsx` - Split into Server/Client
- `components/hr-sidebar.tsx` - Update navigation

**Files mới:**
- `app/actions/dashboard.ts` - Server Actions
- `app/actions/employee.ts` - Server Actions (nếu chưa có)
- `app/actions/department.ts` - Server Actions (nếu chưa có)
- `app/dashboard/page.tsx` - Dashboard route
- `app/employees/page.tsx` - Employees route
- `app/departments/page.tsx` - Departments route
- `components/hr-dashboard-client.tsx` - Client wrapper
- `components/employee-management-client.tsx` - Client wrapper

**Estimated changes:** 10-15 files

---

### Phase 4: Next.js Routing
**Files cần update:**
- `app/page.tsx` - Update for login/redirect
- `components/hr-sidebar.tsx` - Use Next.js Link
- `components/hr-header.tsx` - Update navigation if needed

**Files mới:**
- `app/(authenticated)/layout.tsx` - Shared layout
- `app/(authenticated)/dashboard/page.tsx`
- `app/(authenticated)/employees/page.tsx`
- `app/(authenticated)/departments/page.tsx`
- `app/(authenticated)/attendance/page.tsx`
- `app/(authenticated)/leave/page.tsx`
- `app/(authenticated)/payroll/page.tsx`
- `app/(authenticated)/reports/page.tsx`
- `app/(authenticated)/audit/page.tsx`

**Estimated changes:** 10-12 files

---

### Phase 5: Middleware
**Files mới:**
- `middleware.ts` - Route protection

**Estimated changes:** 1 file

---

## 🎯 Quick Reference - Checklist nhanh

### Before Starting:
- [ ] Git commit current state
- [ ] Create feature branch
- [ ] Read relevant section in guide
- [ ] Prepare test data

### During Implementation:
- [ ] Follow step-by-step guide
- [ ] Test after each small change
- [ ] Commit after each working step
- [ ] Check console for errors
- [ ] Verify functionality

### After Implementation:
- [ ] Test all features
- [ ] Check performance metrics
- [ ] Verify bundle size
- [ ] Test with different browsers
- [ ] Update documentation

---

**Last Updated:** 2025-12-06  
**Version:** 2.0.0  
**Status:** Ready for implementation  
**Based on:** Lessons learned from previous optimization attempt

