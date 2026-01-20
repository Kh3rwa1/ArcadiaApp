<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameVersion extends Model
{
    protected $fillable = ['game_id', 'version_tag', 'folder_path', 'entry_point', 'is_published', 'is_healthy'];
    protected $casts = ['is_published' => 'boolean', 'is_healthy' => 'boolean'];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function getUrlAttribute()
    {
        return asset($this->folder_path . '/' . $this->entry_point);
    }
}
