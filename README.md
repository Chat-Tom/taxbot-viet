# TaxBot Vietnam - Production Ready

## Giới thiệu
TaxBot Vietnam là ứng dụng quản lý thuế thông minh dành cho doanh nghiệp và cá nhân Việt Nam. Tích hợp AI để tính toán thuế chính xác, tuân thủ pháp luật Việt Nam.

## Tính năng chính
- **Tính toán thuế tự động**: Thuế TNCN, TNDN, GTGT
- **Tư vấn AI**: Phân tích và tư vấn thuế thông minh
- **Quản lý khách hàng**: Dashboard admin và customer
- **Gói dịch vụ**: Nhiều gói dịch vụ phù hợp nhu cầu
- **PWA**: Hỗ trợ offline, cài đặt như app native

## Cấu trúc dự án
```
├── client/          # Frontend React app
├── server/          # Backend Express.js
├── shared/          # Shared types và schemas
├── package.json     # Dependencies
└── README.md        # Tài liệu này
```

## Cài đặt và chạy
```bash
npm install
npm run dev
```

## Triển khai Production
```bash
npm run build
npm start
```

## Môi trường cần thiết
- `DATABASE_URL`: PostgreSQL connection
- `OPENAI_API_KEY`: For AI tax advisory
- `EMAIL_USER`, `EMAIL_PASS`: Gmail SMTP
- `JWT_SECRET`: For authentication
- `ZAPIER_WEBHOOK_URL`: For integrations

## Phiên bản
v1.0.0 - Ready for App Store deployment