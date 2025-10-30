import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'air';
type GameMode = 'menu' | 'creative' | 'survival' | 'hardcore' | 'adventure' | 'pvp';

interface Block {
  type: BlockType;
  x: number;
  y: number;
  z: number;
}

interface InventoryItem {
  type: BlockType;
  count: number;
}

const BLOCK_SIZE = 32;
const WORLD_WIDTH = 20;
const WORLD_HEIGHT = 15;

const blockColors: Record<BlockType, string> = {
  grass: '#228B22',
  dirt: '#8B4513',
  stone: '#708090',
  wood: '#8B4513',
  air: 'transparent'
};

const blockLabels: Record<BlockType, string> = {
  grass: 'Трава',
  dirt: 'Земля',
  stone: 'Камень',
  wood: 'Дерево',
  air: 'Воздух'
};

const Index = () => {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [world, setWorld] = useState<Block[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { type: 'grass', count: 64 },
    { type: 'dirt', count: 64 },
    { type: 'stone', count: 64 },
    { type: 'wood', count: 64 }
  ]);
  const [selectedBlock, setSelectedBlock] = useState<BlockType>('grass');
  const [health, setHealth] = useState(100);
  const [hunger, setHunger] = useState(100);
  const [showInventory, setShowInventory] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (gameMode !== 'menu') {
      generateWorld();
    }
  }, [gameMode]);

  useEffect(() => {
    if (gameMode === 'survival' || gameMode === 'hardcore' || gameMode === 'adventure') {
      const hungerInterval = setInterval(() => {
        setHunger(prev => {
          const newHunger = Math.max(0, prev - 0.5);
          if (newHunger === 0) {
            setHealth(h => Math.max(0, h - 1));
          }
          return newHunger;
        });
      }, 3000);

      return () => clearInterval(hungerInterval);
    }
  }, [gameMode]);

  useEffect(() => {
    if (health === 0 && gameMode === 'hardcore') {
      toast.error('Игра окончена! Хардкор режим не прощает ошибок');
      setGameMode('menu');
    }
  }, [health, gameMode]);

  useEffect(() => {
    drawWorld();
  }, [world]);

  const generateWorld = () => {
    const blocks: Block[] = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const height = Math.floor(Math.random() * 3) + 8;
      for (let y = 0; y < height; y++) {
        if (y === height - 1) {
          blocks.push({ type: 'grass', x, y, z: 0 });
        } else if (y > height - 4) {
          blocks.push({ type: 'dirt', x, y, z: 0 });
        } else {
          blocks.push({ type: 'stone', x, y, z: 0 });
        }
      }
      
      if (Math.random() > 0.8) {
        const treeHeight = 3;
        for (let t = 0; t < treeHeight; t++) {
          blocks.push({ type: 'wood', x, y: height + t, z: 0 });
        }
      }
    }
    setWorld(blocks);
  };

  const drawWorld = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    world.forEach(block => {
      if (block.type === 'air') return;
      
      const screenY = canvas.height - (block.y + 1) * BLOCK_SIZE;
      const screenX = block.x * BLOCK_SIZE;

      ctx.fillStyle = blockColors[block.type];
      ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);

      if (block.type === 'grass') {
        ctx.fillStyle = '#1a5f1a';
        ctx.fillRect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE / 4);
      }
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = Math.floor((e.clientX - rect.left) / BLOCK_SIZE);
    const clickY = Math.floor((canvas.height - (e.clientY - rect.top)) / BLOCK_SIZE);

    const existingBlockIndex = world.findIndex(
      b => b.x === clickX && b.y === clickY
    );

    if (e.button === 0) {
      if (existingBlockIndex === -1) {
        const item = inventory.find(i => i.type === selectedBlock);
        if (item && item.count > 0) {
          setWorld([...world, { type: selectedBlock, x: clickX, y: clickY, z: 0 }]);
          setInventory(inventory.map(i => 
            i.type === selectedBlock ? { ...i, count: i.count - 1 } : i
          ));
          toast.success(`Размещен блок: ${blockLabels[selectedBlock]}`);
        } else {
          toast.error('Недостаточно блоков в инвентаре!');
        }
      }
    } else if (e.button === 2) {
      if (existingBlockIndex !== -1) {
        const block = world[existingBlockIndex];
        setWorld(world.filter((_, i) => i !== existingBlockIndex));
        setInventory(inventory.map(i => 
          i.type === block.type ? { ...i, count: i.count + 1 } : i
        ));
        toast.success(`Удален блок: ${blockLabels[block.type]}`);
      }
    }
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setHealth(100);
    setHunger(100);
    toast.success(`Запущен режим: ${getModeLabel(mode)}`);
  };

  const getModeLabel = (mode: GameMode) => {
    const labels = {
      menu: 'Меню',
      creative: 'Творчество',
      survival: 'Выживание',
      hardcore: 'Хардкор',
      adventure: 'Приключения',
      pvp: 'PvP'
    };
    return labels[mode];
  };

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-sky-600 p-4">
        <Card className="p-8 bg-card border-4 border-black shadow-pixel max-w-2xl w-full">
          <h1 className="text-4xl text-center mb-8 text-primary">PIXELCRAFT</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => startGame('creative')}
              className="h-16 text-lg bg-primary hover:bg-primary/90 border-4 border-black shadow-pixel"
            >
              <Icon name="Paintbrush" className="mr-2" size={20} />
              Творчество
            </Button>
            <Button 
              onClick={() => startGame('survival')}
              className="h-16 text-lg bg-accent hover:bg-accent/90 border-4 border-black shadow-pixel"
            >
              <Icon name="Heart" className="mr-2" size={20} />
              Выживание
            </Button>
            <Button 
              onClick={() => startGame('hardcore')}
              className="h-16 text-lg bg-destructive hover:bg-destructive/90 border-4 border-black shadow-pixel"
            >
              <Icon name="Skull" className="mr-2" size={20} />
              Хардкор
            </Button>
            <Button 
              onClick={() => startGame('adventure')}
              className="h-16 text-lg bg-secondary hover:bg-secondary/90 border-4 border-black shadow-pixel"
            >
              <Icon name="Map" className="mr-2" size={20} />
              Приключения
            </Button>
            <Button 
              onClick={() => startGame('pvp')}
              className="h-16 text-lg bg-muted hover:bg-muted/90 border-4 border-black shadow-pixel md:col-span-2"
            >
              <Icon name="Swords" className="mr-2" size={20} />
              PvP Режим
            </Button>
          </div>
          <p className="text-center mt-8 text-sm opacity-75">
            ЛКМ - Поставить блок | ПКМ - Убрать блок
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-400 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex gap-4">
        <Button 
          onClick={() => setGameMode('menu')}
          className="bg-destructive border-4 border-black shadow-pixel"
          size="sm"
        >
          <Icon name="Home" size={16} />
        </Button>
        <Button 
          onClick={() => setShowInventory(!showInventory)}
          className="bg-primary border-4 border-black shadow-pixel"
          size="sm"
        >
          <Icon name="Package" size={16} />
        </Button>
      </div>

      {(gameMode === 'survival' || gameMode === 'hardcore' || gameMode === 'adventure') && (
        <div className="absolute top-4 right-4 z-10 space-y-2 bg-card/90 p-4 border-4 border-black shadow-pixel">
          <div className="flex items-center gap-2">
            <Icon name="Heart" className="text-destructive" size={16} />
            <Progress value={health} className="w-32 h-4 border-2 border-black" />
            <span className="text-xs">{health}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Drumstick" className="text-accent" size={16} />
            <Progress value={hunger} className="w-32 h-4 border-2 border-black" />
            <span className="text-xs">{hunger}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center min-h-screen p-4">
        <canvas
          ref={canvasRef}
          width={WORLD_WIDTH * BLOCK_SIZE}
          height={WORLD_HEIGHT * BLOCK_SIZE}
          onClick={handleCanvasClick}
          onContextMenu={(e) => {
            e.preventDefault();
            handleCanvasClick(e as any);
          }}
          className="border-8 border-black shadow-pixel cursor-crosshair bg-white"
        />
      </div>

      {showInventory && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-card/95 p-4 border-4 border-black shadow-pixel">
          <h3 className="text-sm mb-4 text-center">ИНВЕНТАРЬ</h3>
          <div className="flex gap-2">
            {inventory.map((item, index) => (
              <button
                key={index}
                onClick={() => setSelectedBlock(item.type)}
                className={`w-16 h-16 border-4 border-black flex flex-col items-center justify-center transition-transform hover:scale-110 ${
                  selectedBlock === item.type ? 'ring-4 ring-primary' : ''
                }`}
                style={{ backgroundColor: blockColors[item.type] }}
              >
                <span className="text-xs text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-xs bg-card/80 p-2 border-2 border-black">
        Режим: {getModeLabel(gameMode)}
      </div>
    </div>
  );
};

export default Index;
