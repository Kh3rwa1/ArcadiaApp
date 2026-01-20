<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Like extends Model
{
    protected $fillable = ['user_uuid', 'game_id'];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }
}
