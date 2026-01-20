<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Game;
use Illuminate\Support\Str;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        $games = [
            ['title' => 'Neon Clicker', 'slug' => 'neon-uuid', 'category' => 'Arcade'],
            ['title' => 'Zen Balancer', 'slug' => 'zen-uuid', 'category' => 'Zen'],
            ['title' => 'Dot Hunter', 'slug' => 'dot-hunter', 'category' => 'Action'],
            ['title' => 'Color Match', 'slug' => 'color-match', 'category' => 'Puzzle'],
            ['title' => 'Gravity Jump', 'slug' => 'gravity-jump', 'category' => 'Action'],
            ['title' => 'Math Dash', 'slug' => 'math-dash', 'category' => 'Brain'],
            ['title' => 'Memory Flip', 'slug' => 'memory-flip', 'category' => 'Brain'],
            ['title' => 'Arcadia Bird', 'slug' => 'arcadia-bird', 'category' => 'Action'],
            ['title' => 'Arcadia Blocks', 'slug' => 'arcadia-blocks', 'category' => 'Arcade'],
            ['title' => 'Neon Nebula', 'slug' => 'neon-nebula', 'category' => 'Zen'],
            ['title' => 'Nebula Drift', 'slug' => 'nebula-drift', 'category' => 'Action'],
            ['title' => 'Voxel Runner', 'slug' => 'voxel-runner', 'category' => 'Endless'],
            ['title' => 'Cyber Golf', 'slug' => 'cyber-golf', 'category' => 'Arcade'],
            ['title' => 'Sphere Quest', 'slug' => 'sphere-quest', 'category' => 'Puzzle'],
            ['title' => 'Neon Knights', 'slug' => 'neon-knights', 'category' => 'Action'],
            ['title' => 'Quantum Racer', 'slug' => 'quantum-racer', 'category' => 'Racing'],
            ['title' => 'Shadow Striker', 'slug' => 'shadow-striker', 'category' => 'Action'],
            ['title' => 'Crystal Caverns', 'slug' => 'crystal-caverns', 'category' => 'Puzzle'],
            ['title' => 'Neon Drift', 'slug' => 'neon-drift', 'category' => 'Racing'],
            ['title' => 'Gravity Shift', 'slug' => 'gravity-shift', 'category' => 'Platformer'],
            ['title' => 'Cyber Siege', 'slug' => 'cyber-siege', 'category' => 'Strategy'],
            ['title' => 'Photon Blaster', 'slug' => 'photon-blaster', 'category' => 'Action'],
            ['title' => 'Lava Escape', 'slug' => 'lava-escape', 'category' => 'Endless'],
            ['title' => 'Circuit Breaker', 'slug' => 'circuit-breaker', 'category' => 'Puzzle'],
            ['title' => 'Astro Miner', 'slug' => 'astro-miner', 'category' => 'Simulation'],
        ];

        foreach ($games as $g) {
            $game = Game::create([
                'uuid' => (string) Str::uuid(),
                'title' => $g['title'],
                'slug' => $g['slug'],
                'description' => "Experience the thrill of {$g['title']}!",
                'is_active' => true,
                'settings' => ['categories' => [$g['category']]],
                'type' => 'game',
            ]);

            // Check if directory exists in public/games
            $folderPath = "games/{$g['slug']}";
            
            // If index.html doesn't exist in root, but does in v1, use v1
            if (!file_exists(public_path($folderPath . '/index.html'))) {
                if (file_exists(public_path($folderPath . '/v1/index.html'))) {
                    $folderPath = $folderPath . '/v1';
                }
            }

            $game->versions()->create([
                'version_tag' => 'v1.0.0',
                'folder_path' => $folderPath,
                'entry_point' => 'index.html',
                'is_published' => true,
                'is_healthy' => true,
            ]);
        }
    }
}
