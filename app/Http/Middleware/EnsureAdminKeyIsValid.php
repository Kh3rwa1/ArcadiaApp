<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminKeyIsValid
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $adminKey = config('app.admin_api_key');

        if (!$adminKey || $request->header('X-Arcadia-Admin-Key') !== $adminKey) {
            return response()->json([
                'error' => 'Unauthorized infrastructure access.',
                'message' => 'Invalid or missing X-Arcadia-Admin-Key header.'
            ], 403);
        }

        return $next($request);
    }
}
