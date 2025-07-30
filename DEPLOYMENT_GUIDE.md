# TaxBot Vietnam - Deployment Guide

## Cài đặt nhanh

### 1. Clone và cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment variables
Tạo file `.env.production`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/taxbot
OPENAI_API_KEY=your_openai_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
JWT_SECRET=your_jwt_secret_key
ZAPIER_WEBHOOK_URL=your_zapier_webhook_url
```

### 3. Thiết lập database
```bash
npm run db:push
```

### 4. Build và chạy
```bash
npm run build
npm start
```

## Tính năng

✅ **AI Tax Calculator**: Tính toán thuế thông minh với AI
✅ **PWA Support**: Cài đặt như app mobile
✅ **Offline Mode**: Hoạt động offline với Service Worker
✅ **Admin Dashboard**: Quản lý khách hàng và dịch vụ
✅ **Customer Portal**: Giao diện khách hàng
✅ **Email Integration**: Gửi email tự động
✅ **Database**: PostgreSQL với Drizzle ORM
✅ **Security**: JWT authentication, input validation
✅ **Vietnamese Tax Law**: Tuân thủ luật thuế Việt Nam

## App Store Ready

Package này đã sẵn sàng để triển khai lên:
- Google Play Store (PWA)
- Apple App Store (PWA)
- Web hosting platforms
- Cloud services

## Hỗ trợ

Để được hỗ trợ, liên hệ team phát triển TaxBot Vietnam.
