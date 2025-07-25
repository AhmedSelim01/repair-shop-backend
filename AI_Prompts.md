
# AI Prompts for Repair Shop Backend System

## Prompt 1: API Testing Collection Generator

```
You are an expert API testing specialist. I have a comprehensive repair shop management backend system built with Node.js, Express, and MongoDB. I need you to create a complete JSON test collection (Thunder Client/Postman format) that covers ALL API endpoints with realistic test scenarios.

**BACKEND SYSTEM OVERVIEW:**
- **Authentication System**: JWT-based with role-based access control (admin, employee, customer, driver)
- **User Management**: Registration, login, profile management, role transitions
- **Vehicle Management**: Truck registration, driver assignments, company profiles
- **Job Management**: Job card creation, status tracking, cost estimation, completion workflows
- **Payment Processing**: Multiple payment methods (cash, card, bank transfer), transaction history, analytics
- **Store Management**: Inventory items, shopping cart, recommendations
- **Admin Panel**: Dashboard analytics, user management, system health monitoring
- **Notifications**: Real-time notifications, email services, WebSocket integration
- **Security**: Rate limiting, input validation, CORS, helmet protection

**KEY ENDPOINTS TO TEST:**

**Authentication & Users:**
- POST /api/auth/register (customer, driver, employee, admin registration)
- POST /api/auth/login
- POST /api/auth/reset-password
- GET /api/users (with role-based filtering)
- PUT /api/users/:id (profile updates)
- DELETE /api/users/:id (admin only)

**Vehicle & Driver Management:**
- POST /api/drivers (create driver profile)
- GET /api/drivers (list with search/filter)
- PUT /api/drivers/:id (update driver)
- POST /api/trucks (register truck)
- GET /api/trucks (list trucks)
- PUT /api/trucks/:id (update truck)

**Job Cards & Services:**
- POST /api/jobcards (create job)
- GET /api/jobcards (list with status filters)
- PUT /api/jobcards/:id (update status, add notes)
- POST /api/jobcards/:id/complete (mark complete)
- GET /api/jobcards/analytics (performance metrics)

**Payment System:**
- POST /api/payments (process payment with multiple methods)
- GET /api/payments (transaction history)
- GET /api/payments/analytics (revenue analytics)
- POST /api/payments/webhook (payment gateway webhook)

**Store & Cart:**
- POST /api/store/items (create inventory item)
- GET /api/store/items (list with search)
- POST /api/cart/add (add to cart)
- GET /api/cart (view cart)
- POST /api/cart/checkout (complete purchase)

**Admin Panel:**
- GET /api/admin/dashboard (comprehensive analytics)
- GET /api/admin/users (user management with pagination)
- POST /api/admin/users/bulk (bulk user operations)
- GET /api/admin/system-health (system metrics)

**Notifications:**
- GET /api/notifications (user notifications)
- POST /api/notifications/send (admin send notification)
- PUT /api/notifications/:id/read (mark as read)

**TESTING REQUIREMENTS:**
1. **Success Scenarios**: All endpoints with valid data and proper authentication
2. **Authentication Tests**: Valid tokens, expired tokens, missing tokens, wrong roles
3. **Validation Tests**: Invalid data formats, missing required fields, boundary testing
4. **Authorization Tests**: Role-based access control verification
5. **Error Handling**: 400, 401, 403, 404, 500 error scenarios
6. **Edge Cases**: Empty responses, large data sets, special characters

**JSON FORMAT REQUIREMENTS:**
- Include realistic test data (Dubai-based truck repair shop)
- Set up environment variables for tokens and base URLs
- Include response validation tests
- Add pre-request scripts for token management
- Use proper HTTP methods and headers
- Include comprehensive test descriptions

**SAMPLE DATA CONTEXT:**
- Location: Dubai, UAE
- Business: Heavy truck repair and maintenance
- Vehicles: Mercedes Actros, Volvo FH, Scania trucks
- Services: Engine repair, brake maintenance, electrical work
- Payment: AED currency, local bank integration

Generate a complete Thunder Client JSON collection that a developer can import and run to demonstrate the full capabilities of this production-ready API system to potential employers.
```

## Prompt 2: Frontend Development Specification

```
You are a senior full-stack developer tasked with creating a modern, production-ready frontend application for a comprehensive repair shop management system. I have a complete backend API and need you to develop the frontend architecture and implementation.

**BACKEND SYSTEM ARCHITECTURE:**

**Authentication & Authorization:**
- JWT-based authentication with secure token management
- Role-based access control: admin, employee, customer, driver
- Protected routes and conditional rendering based on user roles
- Password reset and account verification workflows

**Core Entities & Relationships:**
- **Users**: Multi-role system with profile management and role transitions
- **Companies**: Business registration with license verification and owner details
- **Drivers**: Professional profiles with certifications and performance tracking
- **Trucks**: Vehicle registration with technical specifications and maintenance history
- **Job Cards**: Service requests with status tracking, cost estimation, and completion workflows
- **Payments**: Multi-method processing (cash, card, bank) with transaction history
- **Store Items**: Inventory management with cart functionality and recommendations
- **Notifications**: Real-time updates and email integration

**API ENDPOINTS STRUCTURE:**

**Authentication System:**
- Registration/Login with role selection
- Profile management and role transitions
- Password reset and email verification

**Dashboard Systems:**
- **Admin Dashboard**: User management, system analytics, revenue tracking, performance metrics
- **Employee Dashboard**: Job management, customer service, inventory tracking
- **Customer Dashboard**: Service history, payment tracking, notifications
- **Driver Dashboard**: Job assignments, performance metrics, earning tracking

**Core Business Features:**
- **Job Management**: Create, track, update service requests with real-time status
- **Vehicle Management**: Truck registration, driver assignments, maintenance schedules
- **Payment Processing**: Secure payment forms, transaction history, invoice generation
- **Inventory System**: Store management, shopping cart, recommendation engine
- **Analytics**: Revenue tracking, performance metrics, predictive insights

**Real-time Features:**
- Live job status updates
- Instant notifications
- Real-time chat/messaging
- Live analytics dashboard updates

**FRONTEND REQUIREMENTS:**

**Technology Stack Recommendation:**
- React.js with TypeScript for type safety
- State management (Redux Toolkit or Zustand)
- UI Framework (Material-UI, Ant Design, or Chakra UI)
- Real-time: Socket.io client
- Charts: Recharts or Chart.js
- Forms: React Hook Form with Yup validation
- HTTP Client: Axios with interceptors
- Routing: React Router v6

**Key Pages & Components:**

**Authentication Flow:**
- Login/Register pages with role selection
- Password reset workflow
- Email verification pages
- Protected route components

**Admin Interface:**
- Comprehensive dashboard with analytics
- User management with bulk operations
- System health monitoring
- Revenue and performance analytics
- Advanced filtering and search

**Employee Interface:**
- Job management dashboard
- Customer service tools
- Inventory management
- Payment processing interface

**Customer Interface:**
- Service request creation
- Job tracking and history
- Payment and invoice management
- Store browsing and cart

**Driver Interface:**
- Job assignment dashboard
- Performance tracking
- Earnings and payment history
- Route optimization

**Core Features to Implement:**
- **Responsive Design**: Mobile-first approach for all user types
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Search**: Filtering, sorting, pagination
- **Data Visualization**: Charts, graphs, analytics dashboards
- **Form Management**: Dynamic forms with validation
- **File Upload**: Document and image handling
- **Print/Export**: PDF generation, Excel exports
- **Notification System**: Toast notifications, in-app alerts
- **Theme Support**: Light/dark mode toggle

**Security & Performance:**
- Token management with automatic refresh
- Input sanitization and validation
- Image optimization and lazy loading
- Code splitting and lazy imports
- Error boundaries and fallback UI
- Offline support with service workers

**Design Requirements:**
- Modern, professional design suitable for B2B environment
- Dubai/UAE cultural considerations
- Arabic/English language support preparation
- Intuitive navigation with role-based menus
- Consistent design system and components
- Accessibility compliance (WCAG guidelines)

**Integration Points:**
- RESTful API consumption with proper error handling
- Real-time WebSocket connections
- Payment gateway integration
- Email service integration
- File upload and management
- Analytics and reporting

**Deployment Considerations:**
- Environment configuration management
- Build optimization for production
- CDN integration for assets
- Progressive Web App (PWA) capabilities

Create a complete frontend application architecture with component structure, state management patterns, routing configuration, and implementation details that perfectly complement this sophisticated backend system. The frontend should be interview-ready and demonstrate advanced React development skills suitable for senior developer positions.
```
