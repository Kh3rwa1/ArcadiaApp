<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    /**
     * Simple health check endpoint.
     * Used by the Admin Panel and Load Balancers to verify connectivity.
     */
    public function check(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'service' => 'arcadia-api',
            'version' => '1.0.0'
        ]);
    }
}
