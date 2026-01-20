<?php

use App\Http\Controllers\Admin\GameController as AdminGameController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\FeedController;
use App\Http\Controllers\Api\ProgressController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Consumer Feed (Public)
Route::prefix('v1/feed')->group(function () {
    Route::get('/', [FeedController::class, 'index']);
});

// System Health Check
Route::get('/health-check', [App\Http\Controllers\Api\HealthController::class, 'check']);
Route::get('/v1/health', [App\Http\Controllers\Api\HealthController::class, 'check']);

// Analytics (High Frequency)
Route::prefix('v1/analytics')->group(function () {
    Route::post('/event', [AnalyticsController::class, 'track']);
});

// Game Progress (Save/Load)
Route::prefix('v1/progress')->group(function () {
    Route::get('/{gameUuid}', [ProgressController::class, 'load']);
    Route::post('/save', [ProgressController::class, 'save']);
    Route::post('/batch', [ProgressController::class, 'batch']);
});

// Game Interactions
Route::prefix('v1/games/{gameUuid}')->group(function () {
    Route::post('/like', [App\Http\Controllers\Api\GameInteractionController::class, 'like']);
    Route::post('/unlike', [App\Http\Controllers\Api\GameInteractionController::class, 'unlike']);
    Route::get('/comments', [App\Http\Controllers\Api\GameInteractionController::class, 'comments']);
    Route::post('/comments', [App\Http\Controllers\Api\GameInteractionController::class, 'addComment']);
    Route::get('/stats', [App\Http\Controllers\Api\GameInteractionController::class, 'stats']);
});

// Internal/Admin API (Protected by Admin Key)
Route::prefix('admin')->middleware([\App\Http\Middleware\EnsureAdminKeyIsValid::class])->group(function () {
    Route::get('/games', [AdminGameController::class, 'index']);
    Route::post('/games/upload', [AdminGameController::class, 'store']);
    Route::patch('/games/{game:uuid}/status', [AdminGameController::class, 'updateStatus']);
    Route::post('/games/{game:uuid}/toggle-featured', [AdminGameController::class, 'toggleFeatured']);
    Route::get('/games/{game:uuid}/analytics', [AdminGameController::class, 'getAnalytics']);
    Route::patch('/games/{game:uuid}/config', [AdminGameController::class, 'updateConfig']);
});
