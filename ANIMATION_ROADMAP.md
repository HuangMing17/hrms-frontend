# 🎨 Animation Roadmap - HRMS Frontend

Tài liệu này liệt kê các animation cần thêm vào các trang để tăng trải nghiệm người dùng mượt mà và chuyên nghiệp.

## 📋 Mục lục
1. [Authentication Pages](#authentication-pages)
2. [Dashboard](#dashboard)
3. [Management Pages](#management-pages)
4. [Modals & Dialogs](#modals--dialogs)
5. [Tables & Lists](#tables--lists)
6. [Forms](#forms)
7. [Charts & Analytics](#charts--analytics)
8. [Navigation](#navigation)
9. [Loading States](#loading-states)
10. [Notifications & Alerts](#notifications--alerts)

---

## 🔐 Authentication Pages

### Login Page (`login-page.tsx`)
- [x] **Page Entrance Animation**
  - ✅ Fade in + slide up cho toàn bộ form (duration: 400ms)
  - ✅ Stagger animation cho các input fields (delay: 50ms mỗi field)
  
- [x] **Form Interactions**
  - ✅ Input focus: Scale up nhẹ (1.01) với border color transition
  - ✅ Button hover: Scale (1.02) + shadow elevation
  - ✅ Button click: Scale down (0.98) với bounce back
  - ✅ Error message: Slide down + fade in với shake animation
  
- [x] **Loading State**
  - ✅ Button loading: Spinner với fade in
  - ✅ Disable form với opacity transition

### Reset Password Page (`reset-password-page.tsx`)
- [x] **Page Transition**
  - ✅ Slide in từ phải với fade
  - ✅ Success message: Scale up + fade in với checkmark icon animation

---

## 📊 Dashboard

### HR Dashboard (`hr-dashboard.tsx`)
- [ ] **Card Entrance**
  - Stagger animation cho các stat cards (delay: 100ms mỗi card)
  - Fade in + slide up từ bottom
  - Hover effect: Lift up với shadow (translateY: -4px)
  
- [ ] **Chart Animations**
  - Bar charts: Animate từ bottom lên (duration: 800ms, easing: ease-out)
  - Line charts: Draw line animation từ trái sang phải
  - Pie charts: Rotate + scale in với stagger cho từng slice
  
- [ ] **Real-time Updates**
  - Number counter animation khi data thay đổi
  - Pulse effect cho cards có thay đổi mới
  - Smooth transition cho color changes

- [ ] **Filter & Date Range**
  - Dropdown: Slide down + fade in
  - Date picker: Scale in từ trigger point

---

## 👥 Management Pages

### Employee Management (`employee-management.tsx`)
- [ ] **Table Row Animations**
  - Row entrance: Fade in + slide từ trái (stagger: 50ms)
  - Row hover: Background color transition + slight scale (1.01)
  - Row selection: Highlight với slide animation
  
- [ ] **Action Buttons**
  - Button group: Fade in với stagger
  - Icon buttons: Scale on hover (1.1) + rotate on click
  - Delete button: Shake animation khi confirm
  
- [ ] **Search & Filter**
  - Search input: Expand animation khi focus
  - Filter dropdown: Slide down + fade in
  - Clear filters: Fade out + slide up
  
- [ ] **Pagination**
  - Page transition: Fade out → fade in với slide
  - Page number hover: Scale + color transition

### Department Management (`department-management.tsx`)
- [ ] **Tree/Hierarchy View**
  - Node expand/collapse: Height transition với ease-in-out
  - Children nodes: Slide in từ trái với fade
  - Drag & drop: Smooth transition với shadow elevation
  
- [ ] **Card Grid**
  - Card entrance: Scale in + fade (stagger: 100ms)
  - Card hover: Lift + shadow increase
  - Card click: Scale down (0.98) với bounce back

### Attendance Management (`attendance-management.tsx`)
- [ ] **Calendar View**
  - Month transition: Slide left/right với fade
  - Day cell hover: Scale (1.05) + border highlight
  - Status badges: Pulse animation cho status changes
  
- [ ] **Weekly Grid**
  - Cell entrance: Fade in với stagger theo row
  - Cell hover: Background color transition
  - Status change: Color transition với ripple effect
  
- [ ] **Time Picker**
  - Dropdown: Slide up + fade in
  - Time selection: Highlight với scale animation

### Leave Management (`leave-management.tsx`)
- [ ] **Request Cards**
  - Card entrance: Slide in từ trái với fade (stagger: 80ms)
  - Status badge: Pulse animation cho pending requests
  - Card hover: Lift + shadow increase
  
- [ ] **Timeline View**
  - Timeline items: Draw line animation từ trái
  - Item entrance: Slide in + fade với stagger
  
- [ ] **Approval Actions**
  - Approve button: Green pulse animation
  - Reject button: Red shake animation
  - Action feedback: Success/error toast với slide in

### Payroll Management (`payroll-management.tsx`)
- [ ] **Tabs Animation**
  - Tab switch: Slide indicator với smooth transition
  - Tab content: Fade in + slide up
  
- [ ] **Preview Cards**
  - Card entrance: Scale in + fade
  - Card hover: Lift với shadow
  - Amount highlight: Number counter animation
  
- [ ] **Bulk Actions**
  - Selection checkbox: Scale animation
  - Bulk action bar: Slide up từ bottom
  - Progress bar: Smooth fill animation

### Audit Management (`audit-management.tsx`)
- [ ] **Log Entries**
  - Entry entrance: Fade in + slide từ trái (stagger: 50ms)
  - Entry hover: Background highlight với smooth transition
  - Expand details: Height transition với accordion animation
  
- [ ] **Filter Panel**
  - Panel toggle: Slide down/up với fade
  - Filter chips: Scale in + fade
  - Clear all: Fade out + scale down

---

## 🪟 Modals & Dialogs

### Employee Detail Modal (`employee-detail-modal.tsx`)
- [ ] **Modal Entrance**
  - Backdrop: Fade in (duration: 200ms)
  - Modal: Scale in (0.95 → 1.0) + fade in (duration: 300ms)
  - Content: Stagger fade in cho các sections
  
- [ ] **Modal Exit**
  - Backdrop: Fade out
  - Modal: Scale down (1.0 → 0.95) + fade out
  
- [ ] **Tab Switching**
  - Tab indicator: Smooth slide transition
  - Tab content: Fade out → fade in với slide

### CV Parser Dialog (`cv-parser-dialog.tsx`)
- [ ] **File Upload**
  - Dropzone hover: Scale (1.02) + border pulse
  - File preview: Slide in từ bottom + fade
  - Upload progress: Smooth progress bar animation
  
- [ ] **Parsing State**
  - Loading spinner: Rotate với fade pulse
  - Progress steps: Highlight với slide animation
  - Success checkmark: Scale in + bounce
  
- [ ] **Result Display**
  - Section entrance: Fade in + slide up (stagger: 100ms)
  - Field highlight: Pulse animation khi có data
  - Confidence badge: Color transition với pulse

### Department Detail Modal (`department-detail-modal.tsx`)
- [ ] **Modal Content**
  - Section tabs: Smooth slide transition
  - Employee list: Stagger fade in
  - Chart: Animate in với delay

### Position Detail Modal (`position-detail-modal.tsx`)
- [ ] **Content Sections**
  - Accordion sections: Smooth height transition
  - Employee cards: Stagger entrance animation

### Promote Employee Dialog (`promote-employee-dialog.tsx`)
- [ ] **Form Steps**
  - Step indicator: Progress animation
  - Step transition: Slide left/right với fade
  - Form fields: Fade in với stagger

---

## 📋 Tables & Lists

### Data Tables (All Management Pages)
- [ ] **Table Entrance**
  - Header row: Fade in + slide down
  - Data rows: Stagger fade in + slide từ trái (delay: 30ms/row)
  
- [ ] **Row Interactions**
  - Row hover: Background color transition + slight lift
  - Row selection: Checkbox scale animation + row highlight
  - Row click: Ripple effect
  
- [ ] **Sorting**
  - Column header hover: Icon scale + color transition
  - Sort indicator: Rotate animation
  - Data reorder: Smooth transition với fade
  
- [ ] **Pagination**
  - Page transition: Fade out → fade in
  - Page number hover: Scale + color change
  - Active page: Pulse animation

### Loading States
- [ ] **Skeleton Loaders**
  - Shimmer animation cho skeleton rows
  - Stagger entrance cho skeleton cards
  - Smooth transition từ skeleton → real content

---

## 📝 Forms

### Form Inputs (All Forms)
- [ ] **Input Focus**
  - Label: Slide up + scale down khi focus
  - Border: Color transition + width animation
  - Icon: Scale + rotate animation
  
- [ ] **Input Validation**
  - Error message: Slide down + fade in với shake
  - Success checkmark: Scale in + bounce
  - Field highlight: Pulse animation
  
- [ ] **Select/Dropdown**
  - Dropdown: Slide down + fade in
  - Option hover: Background highlight với smooth transition
  - Option select: Checkmark slide in từ trái
  
- [ ] **Date Picker**
  - Calendar: Scale in + fade từ trigger point
  - Month navigation: Slide transition
  - Date selection: Scale animation + color transition

### Form Submission
- [ ] **Submit Button**
  - Loading state: Spinner fade in + button disable animation
  - Success: Checkmark scale in + button color transition
  - Error: Shake animation + error message slide in

---

## 📈 Charts & Analytics

### Reports & Analytics (`reports-analytics.tsx`)
- [ ] **Chart Entrance**
  - Chart container: Fade in + scale in (duration: 600ms)
  - Chart elements: Stagger animation (bars, lines, pie slices)
  
- [ ] **Bar Charts**
  - Bars: Animate từ bottom lên (duration: 800ms, easing: ease-out)
  - Bar hover: Scale up (1.05) + tooltip fade in
  - Bar click: Scale down (0.95) với bounce back
  
- [ ] **Line Charts**
  - Lines: Draw animation từ trái sang phải (duration: 1000ms)
  - Points: Scale in với stagger
  - Area fill: Fade in với gradient animation
  
- [ ] **Pie Charts**
  - Slices: Rotate in với stagger (delay: 100ms/slice)
  - Slice hover: Scale out (1.1) + fade others
  - Legend: Fade in với stagger
  
- [ ] **Chart Interactions**
  - Tooltip: Fade in + slide up từ data point
  - Legend toggle: Smooth opacity transition
  - Zoom/Pan: Smooth transition với easing

### AI Report Page (`ai-report.tsx`)
- [ ] **Report Generation**
  - Loading spinner: Rotate với pulse
  - Progress steps: Highlight với slide animation
  - Text generation: Typewriter effect hoặc fade in từng đoạn
  
- [ ] **Tab Switching**
  - Tab indicator: Smooth slide transition
  - Tab content: Fade out → fade in với slide
  
- [ ] **Report Display**
  - Text fade in với stagger cho từng section
  - Chart animations như trên
  - Copy button: Scale animation khi click

---

## 🧭 Navigation

### Sidebar (`hr-sidebar.tsx`)
- [ ] **Sidebar Entrance**
  - Menu items: Stagger fade in + slide từ trái (delay: 50ms/item)
  
- [ ] **Menu Interactions**
  - Item hover: Background slide + icon scale
  - Active item: Highlight với slide animation
  - Submenu: Slide down + fade in
  
- [ ] **Collapse/Expand**
  - Smooth width transition
  - Icon rotation animation
  - Text fade out/in

### Header (`hr-header.tsx`)
- [ ] **Header Elements**
  - Logo: Scale in + fade
  - Search bar: Expand animation khi focus
  - Notifications: Badge pulse animation
  - User menu: Dropdown slide down + fade

### Page Transitions
- [ ] **Route Changes**
  - Current page: Fade out + slide left
  - New page: Fade in + slide từ phải
  - Duration: 300ms với easing

---

## ⏳ Loading States

### Loading Spinners
- [ ] **Global Loading**
  - Spinner: Rotate với fade pulse
  - Backdrop: Fade in với blur effect
  
- [ ] **Button Loading**
  - Spinner fade in + button disable animation
  - Text fade out → spinner fade in
  
- [ ] **Table Loading**
  - Skeleton rows với shimmer animation
  - Smooth transition từ skeleton → data

### Progress Indicators
- [ ] **Progress Bars**
  - Smooth fill animation với easing
  - Percentage counter animation
  - Success: Green fill + checkmark scale in

---

## 🔔 Notifications & Alerts

### Toast Notifications
- [ ] **Toast Entrance**
  - Slide in từ top-right với fade (duration: 300ms)
  - Stagger animation cho multiple toasts
  
- [ ] **Toast Exit**
  - Slide out + fade out
  - Auto-dismiss: Progress bar animation
  
- [ ] **Toast Types**
  - Success: Green slide in + checkmark bounce
  - Error: Red slide in + shake animation
  - Warning: Yellow slide in + pulse
  - Info: Blue slide in + fade pulse

### Alert Dialogs
- [ ] **Dialog Entrance**
  - Backdrop: Fade in
  - Dialog: Scale in (0.95 → 1.0) + fade in
  
- [ ] **Dialog Exit**
  - Backdrop: Fade out
  - Dialog: Scale down + fade out

### Badge Animations
- [ ] **Notification Badge**
  - Pulse animation cho unread count
  - Scale animation khi count changes
  - Bounce animation khi có notification mới

---

## 🎯 Implementation Priority

### Phase 1: Core UX (High Priority) - Estimated: 2-3 weeks
**Goal**: Cải thiện trải nghiệm cơ bản và cảm giác responsive của ứng dụng

1. ✅ **Page transitions** (3-4 days)
   - Route change animations
   - View switching animations
   - Dependencies: Framer Motion setup
   - Impact: High - Ảnh hưởng đến mọi navigation

2. ✅ **Modal/Dialog animations** (2-3 days)
   - Entrance/exit animations
   - Backdrop fade
   - Dependencies: Dialog components
   - Impact: High - Tất cả modals trong app

3. ✅ **Loading states** (2-3 days)
   - Spinner animations
   - Skeleton loaders
   - Progress indicators
   - Dependencies: Loading components
   - Impact: High - User feedback quan trọng

4. ✅ **Form interactions** (3-4 days)
   - Input focus animations
   - Validation feedback
   - Submit button states
   - Dependencies: Form components
   - Impact: High - Tất cả forms

5. ✅ **Button hover/click effects** (1-2 days)
   - Hover scale/shadow
   - Click feedback
   - Loading states
   - Dependencies: Button components
   - Impact: Medium-High - Tất cả buttons

**Total Estimated Effort**: 11-16 days

---

### Phase 2: Data Display (Medium Priority) - Estimated: 2-3 weeks
**Goal**: Làm cho việc hiển thị dữ liệu trở nên mượt mà và hấp dẫn

1. ✅ **Table row animations** (3-4 days)
   - Row entrance với stagger
   - Row hover effects
   - Row selection animations
   - Dependencies: Table components, Phase 1 (page transitions)
   - Impact: Medium-High - Tất cả tables

2. ✅ **Chart animations** (4-5 days) - **COMPLETED**
   - ✅ Bar chart animations (grow from bottom)
   - ✅ Line chart draw animations (draw from left to right)
   - ✅ Pie chart slice animations (stagger appearance)
   - ✅ Tooltip animations (fade in)
   - Dependencies: Recharts/Chart.js, Phase 1 (loading states)
   - Impact: Medium - Dashboard và Reports
   - **Files**: `hr-dashboard.tsx` (ComposedChart, PieChart)

3. ✅ **Card entrance animations** (2-3 days) - **COMPLETED**
   - ✅ Stagger card entrance
   - ✅ Card hover effects
   - Dependencies: Card components
   - Impact: Medium - Dashboard và Management pages
   - **Files**: `animated-card.tsx`, `hr-dashboard.tsx`

4. ✅ **List stagger animations** (2-3 days) - **COMPLETED**
   - ✅ List item entrance với stagger
   - ✅ Filter/sort transitions
   - Dependencies: List components
   - Impact: Medium - Tất cả lists
   - **Files**: `animated-list.tsx`, `hr-dashboard.tsx` (notifications list)

**Total Estimated Effort**: 11-15 days
**Current Progress**: 100% Complete ✅

---

### Phase 3: Polish (Low Priority) - Estimated: 1-2 weeks
**Goal**: Thêm các chi tiết tinh tế để hoàn thiện trải nghiệm

1. ✅ **Micro-interactions** (3-4 days)
   - Icon animations
   - Badge animations
   - Tooltip enhancements
   - Dependencies: Icon components, Phase 1 & 2
   - Impact: Low-Medium - Nice-to-have

2. ✅ **Advanced transitions** (2-3 days)
   - Complex page transitions
   - Shared element transitions
   - Dependencies: Phase 1 & 2
   - Impact: Low - Enhancement

3. ✅ **Particle effects** (Optional, 2-3 days)
   - Success celebrations
   - Background effects
   - Dependencies: Animation library
   - Impact: Low - Optional enhancement

4. ✅ **Custom easing functions** (1-2 days)
   - Brand-specific easing
   - Performance optimization
   - Dependencies: Animation setup
   - Impact: Low - Fine-tuning

**Total Estimated Effort**: 8-12 days

---

### 📊 Overall Timeline Summary

| Phase | Priority | Duration | Dependencies | Impact |
|-------|----------|----------|--------------|--------|
| Phase 1 | High | 2-3 weeks | None | Critical |
| Phase 2 | Medium | 2-3 weeks | Phase 1 | Important |
| Phase 3 | Low | 1-2 weeks | Phase 1 & 2 | Enhancement |

**Total Estimated Time**: 5-8 weeks (có thể làm song song một số tasks)

---

### 🚀 Quick Wins (Có thể làm ngay - 1-2 days)
Những animation đơn giản nhưng có impact cao:

1. ✅ Button hover/click effects (Tailwind CSS)
2. ✅ Loading spinner animations
3. ✅ Modal backdrop fade
4. ✅ Form input focus states
5. ✅ Toast notification slide-in

**Recommendation**: Bắt đầu với Quick Wins để có immediate impact, sau đó tiếp tục Phase 1.

---

## 🛠️ Recommended Libraries

### CSS Animations
- **Tailwind CSS**: Đã có sẵn, sử dụng `animate-*` utilities
- **tw-animate-css**: Đã có trong devDependencies

### JavaScript Animations
- **Framer Motion**: Recommended cho React animations
  ```bash
  npm install framer-motion
  ```
- **React Spring**: Alternative cho physics-based animations
  ```bash
  npm install @react-spring/web
  ```

### CSS Transitions
- Sử dụng Tailwind's `transition-*` utilities
- Custom animations trong `tailwind.config.js`

---

## 📝 Animation Guidelines

### Duration Standards
- **Micro-interactions**: 150-200ms (hover, click)
- **Standard transitions**: 200-300ms (modals, dropdowns)
- **Complex animations**: 400-600ms (page transitions, charts)
- **Long animations**: 800-1000ms (chart draws, complex sequences)

### Easing Functions
- **Ease-out**: Cho entrance animations (feel natural)
- **Ease-in-out**: Cho transitions (smooth both ways)
- **Ease-in**: Cho exit animations (quick exit)
- **Custom cubic-bezier**: Cho special effects

### Performance Considerations
- Sử dụng `transform` và `opacity` cho animations (GPU accelerated)
- Tránh animate `width`, `height`, `top`, `left` (triggers reflow)
- Sử dụng `will-change` cho elements sẽ animate
- Debounce/throttle cho scroll-based animations

---

## ✅ Checklist Template

Khi implement animation cho mỗi component:

- [ ] Animation duration phù hợp (< 1s cho micro-interactions)
- [ ] Easing function smooth và natural
- [ ] Performance optimized (sử dụng transform/opacity)
- [ ] Responsive trên mobile (giảm animation complexity nếu cần)
- [ ] Accessibility: Respect `prefers-reduced-motion`
- [ ] Test trên các browsers khác nhau
- [ ] Animation không làm gián đoạn user flow

---

## 🎨 Animation Examples

### Example 1: Card Entrance
```tsx
// Using Framer Motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.1 }}
>
  <Card>...</Card>
</motion.div>
```

### Example 2: Button Hover
```tsx
// Using Tailwind
<button className="transition-all duration-200 hover:scale-105 hover:shadow-lg">
  Click me
</button>
```

### Example 3: Modal Entrance
```tsx
// Using Framer Motion
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  <DialogContent>...</DialogContent>
</motion.div>
```

---

**Last Updated**: 2025-12-11
**Status**: ✅ Phase 1 Core Completed - Authentication Pages Fully Animated

## ✅ Implementation Status

### Phase 1: Core UX - **COMPLETED** ✅

#### Authentication Pages - **100% Complete**
- ✅ Login Page: Page entrance, stagger animations, form interactions, error shake
- ✅ Forgot Password Modal: Form animations, error shake
- ✅ Reset Password Page: Slide in animation, success checkmark animation

#### Infrastructure - **100% Complete**
- ✅ Framer Motion installed
- ✅ Animation utilities (`animations.ts`)
- ✅ Reusable components (`AnimatedPage`, `AnimatedButton`, `AnimatedInput`)
- ✅ Page transitions (`AnimatedPageTransition`)
- ✅ Loading states with animations
- ✅ Modal/Dialog animations

#### Form Interactions - **100% Complete**
- ✅ Input focus animations
- ✅ Button hover/click effects
- ✅ Error message animations (shake effect)
- ✅ Form validation feedback

**Phase 1 Progress**: 100% Complete ✅

