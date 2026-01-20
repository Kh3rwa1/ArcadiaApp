# TikTok Games Backend (Laravel)

## Overview
High-performance Laravel backend for an Android-first HTML5 game streaming platform. Optimized for low-latency feed delivery and secure game deployments.

## Architecture
- **API-First**: Designed for mobile consumers.
- **Stateless Feed**: Cursor-based pagination for fluid swipe discovery.
- **Atomic Deployments**: Versioned game storage to prevent caching issues and allow rollbacks.
- **Analytics Pipeline**: Lightweight logging for engagement metrics.

## Tech Stack
- Laravel 11.x
- MySQL 8.0
- PHP 8.2+
- Redis (for Feed Caching & Analytics buffering)

## Security Constraints
1. **ZIP Sanitization**: The `GameDeploymentService` validates the presence of `index.html`. In production, implement folder traversal checks (preventing `../` in ZIP entries).
2. **Execution Prevention**: Disable PHP execution in `/public/games/` via Nginx or `.htaccess`:
   ```nginx
   location /games/ {
       location ~ \.php$ {
           deny all;
       }
   }
   ```
3. **Storage Strategy**: Files are extracted to versioned directories to ensure atomicity. Old versions can be archived or deleted after a cooling period.
4. **CORS Policy**: Restrict game asset loading to your mobile app's origin or specific domains.

## Performance Considerations
1. **Cursor Pagination**: Used in Feed discovery to ensure consistent O(1) performance even with millions of games.
2. **Analytics Buffering**: For high-scale, the `AnalyticsController` should push events to Redis/SQS rather than hit MySQL directly.
3. **CDN Integration**: In production, `public/games/` should be behind a CloudFront or Cloudflare CDN with aggressive caching on versioned paths.

