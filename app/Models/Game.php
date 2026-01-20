<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Game extends Model
{
    use SoftDeletes;

    protected $fillable = ['uuid', 'title', 'slug', 'description', 'thumbnail_url', 'is_active', 'settings', 'type', 'category', 'config'];
    protected $casts = [
        'settings' => 'array',
        'config' => 'array',
        'is_active' => 'boolean'
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->uuid = (string) Str::uuid();
        });
    }

    public function versions(): HasMany
    {
        return $this->hasMany(GameVersion::class);
    }

    public function latestVersion(): HasOne
    {
        return $this->hasOne(GameVersion::class)->latestOfMany();
    }

    public function analytics(): HasMany
    {
        return $this->hasMany(GameAnalytic::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
