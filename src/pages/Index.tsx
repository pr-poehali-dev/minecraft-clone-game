import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'air' | 'planks' | 'cobblestone';
type GameMode = 'menu' | 'creative' | 'survival' | 'hardcore' | 'adventure' | 'pvp' | 'servers';
type ServerName = 'funtime' | 'hypixel' | 'mineplex';

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

interface Camera {
  x: number;
  y: number;
  z: number;
  pitch: number;
  yaw: number;
}

const BLOCK_SIZE = 50;
const WORLD_SIZE = 30;
const RENDER_DISTANCE = 15;

const blockColors: Record<BlockType, string> = {
  grass: '#228B22',
  dirt: '#8B4513',
  stone: '#708090',
  wood: '#654321',
  planks: '#DEB887',
  cobblestone: '#808080',
  air: 'transparent'
};

const blockLabels: Record<BlockType, string> = {
  grass: 'Трава',
  dirt: 'Земля',
  stone: 'Камень',
  wood: 'Дерево',
  planks: 'Доски',
  cobblestone: 'Булыжник',
  air: 'Воздух'
};

const Index = () => {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [selectedServer, setSelectedServer] = useState<ServerName | null>(null);
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
  const [camera, setCamera] = useState<Camera>({
    x: 15,
    y: 5,
    z: 15,
    pitch: 0,
    yaw: 0
  });
  const [handAnimation, setHandAnimation] = useState(0);
  const [isSwinging, setIsSwinging] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (gameMode !== 'menu' && gameMode !== 'servers') {
      if (selectedServer === 'funtime') {
        generateVillage();
      } else {
        generateFlatWorld();
      }
    }
  }, [gameMode, selectedServer]);

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
    if (gameMode !== 'menu' && gameMode !== 'servers') {
      const handleKeyDown = (e: KeyboardEvent) => {
        keysPressed.current.add(e.key.toLowerCase());
        
        if (e.key.toLowerCase() === 'e') {
          setShowInventory(prev => !prev);
        }
        
        if (e.key >= '1' && e.key <= '4') {
          const blockIndex = parseInt(e.key) - 1;
          if (inventory[blockIndex]) {
            setSelectedBlock(inventory[blockIndex].type);
            toast.success(`Выбран: ${blockLabels[inventory[blockIndex].type]}`);
          }
        }

        if (e.key.toLowerCase() === 'escape') {
          exitPointerLock();
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current.delete(e.key.toLowerCase());
      };

      const handlePointerLockChange = () => {
        setPointerLocked(document.pointerLockElement === canvasRef.current);
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (pointerLocked) {
          const sensitivity = 0.002;
          setCamera(prev => ({
            ...prev,
            yaw: prev.yaw + e.movementX * sensitivity,
            pitch: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.pitch + e.movementY * sensitivity))
          }));
        }
      };

      document.addEventListener('pointerlockchange', handlePointerLockChange);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('mousemove', handleMouseMove);

      const moveInterval = setInterval(() => {
        setCamera(prev => {
          let newX = prev.x;
          let newZ = prev.z;
          let newY = prev.y;

          const speed = 0.15;
          const forward = { x: -Math.sin(prev.yaw), z: -Math.cos(prev.yaw) };
          const right = { x: Math.cos(prev.yaw), z: -Math.sin(prev.yaw) };

          if (keysPressed.current.has('w')) {
            newX += forward.x * speed;
            newZ += forward.z * speed;
          }
          if (keysPressed.current.has('s')) {
            newX -= forward.x * speed;
            newZ -= forward.z * speed;
          }
          if (keysPressed.current.has('a')) {
            newX -= right.x * speed;
            newZ -= right.z * speed;
          }
          if (keysPressed.current.has('d')) {
            newX += right.x * speed;
            newZ += right.z * speed;
          }
          if (keysPressed.current.has(' ')) {
            newY += speed;
          }
          if (keysPressed.current.has('shift')) {
            newY -= speed;
          }

          newX = Math.max(0, Math.min(WORLD_SIZE - 1, newX));
          newZ = Math.max(0, Math.min(WORLD_SIZE - 1, newZ));
          newY = Math.max(2, Math.min(20, newY));

          return { ...prev, x: newX, y: newY, z: newZ };
        });
      }, 16);

      return () => {
        document.removeEventListener('pointerlockchange', handlePointerLockChange);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousemove', handleMouseMove);
        clearInterval(moveInterval);
      };
    }
  }, [gameMode, pointerLocked, inventory]);

  useEffect(() => {
    if (isSwinging) {
      const animate = () => {
        setHandAnimation(prev => {
          if (prev >= Math.PI) {
            setIsSwinging(false);
            return 0;
          }
          return prev + 0.3;
        });
      };
      const interval = setInterval(animate, 16);
      return () => clearInterval(interval);
    }
  }, [isSwinging]);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => drawWorld());
    return () => cancelAnimationFrame(animationFrame);
  }, [world, camera, handAnimation]);

  const requestPointerLock = () => {
    canvasRef.current?.requestPointerLock();
  };

  const exitPointerLock = () => {
    document.exitPointerLock();
  };

  const generateFlatWorld = () => {
    const blocks: Block[] = [];
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        blocks.push({ type: 'grass', x, y: 0, z });
        blocks.push({ type: 'dirt', x, y: -1, z });
        blocks.push({ type: 'dirt', x, y: -2, z });
      }
    }
    setWorld(blocks);
  };

  const generateVillage = () => {
    const blocks: Block[] = [];
    
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        blocks.push({ type: 'grass', x, y: 0, z });
        blocks.push({ type: 'dirt', x, y: -1, z });
        blocks.push({ type: 'dirt', x, y: -2, z });
      }
    }

    const buildHouse = (startX: number, startZ: number, width: number, depth: number, height: number) => {
      for (let y = 1; y <= height; y++) {
        for (let x = startX; x < startX + width; x++) {
          blocks.push({ type: 'planks', x, y, z: startZ });
          blocks.push({ type: 'planks', x, y, z: startZ + depth - 1 });
        }
        for (let z = startZ; z < startZ + depth; z++) {
          blocks.push({ type: 'planks', x: startX, y, z });
          blocks.push({ type: 'planks', x: startX + width - 1, y, z });
        }
      }

      for (let x = startX; x < startX + width; x++) {
        for (let z = startZ; z < startZ + depth; z++) {
          blocks.push({ type: 'wood', x, y: height + 1, z });
        }
      }

      blocks.push({ type: 'air', x: startX + Math.floor(width / 2), y: 1, z: startZ });
      blocks.push({ type: 'air', x: startX + Math.floor(width / 2), y: 2, z: startZ });
    };

    buildHouse(5, 5, 6, 6, 3);
    buildHouse(13, 5, 5, 5, 3);
    buildHouse(5, 13, 7, 6, 3);
    buildHouse(14, 14, 6, 6, 4);

    for (let x = 10; x <= 12; x++) {
      for (let z = 10; z <= 12; z++) {
        blocks.push({ type: 'cobblestone', x, y: 1, z });
      }
    }

    setWorld(blocks);
    setCamera({ x: 15, y: 5, z: 22, pitch: 0, yaw: 0 });
  };

  const project3DTo2D = (x: number, y: number, z: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, distance: 0 };

    const dx = x - camera.x;
    const dy = y - camera.y;
    const dz = z - camera.z;

    const cosPitch = Math.cos(camera.pitch);
    const sinPitch = Math.sin(camera.pitch);
    const cosYaw = Math.cos(camera.yaw);
    const sinYaw = Math.sin(camera.yaw);

    const rotatedX = dx * cosYaw - dz * sinYaw;
    const rotatedZ = dx * sinYaw + dz * cosYaw;
    const rotatedY = dy * cosPitch + rotatedZ * sinPitch;
    const finalZ = -dy * sinPitch + rotatedZ * cosPitch;

    if (finalZ <= 0.1) return { x: 0, y: 0, distance: -1 };

    const fov = 500;
    const screenX = (rotatedX * fov) / finalZ + canvas.width / 2;
    const screenY = (-rotatedY * fov) / finalZ + canvas.height / 2;

    return { x: screenX, y: screenY, distance: finalZ };
  };

  const drawCube = (ctx: CanvasRenderingContext2D, x: number, y: number, z: number, color: string) => {
    const corners = [
      [x, y, z],
      [x + 1, y, z],
      [x + 1, y + 1, z],
      [x, y + 1, z],
      [x, y, z + 1],
      [x + 1, y, z + 1],
      [x + 1, y + 1, z + 1],
      [x, y + 1, z + 1]
    ];

    const projected = corners.map(([cx, cy, cz]) => project3DTo2D(cx, cy, cz));

    if (projected.some(p => p.distance < 0)) return;

    const faces = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [2, 3, 7, 6],
      [0, 3, 7, 4],
      [1, 2, 6, 5]
    ];

    const faceColors = [
      color,
      adjustBrightness(color, 0.8),
      adjustBrightness(color, 0.9),
      adjustBrightness(color, 0.7),
      adjustBrightness(color, 0.85),
      adjustBrightness(color, 0.95)
    ];

    faces.forEach((face, faceIndex) => {
      ctx.fillStyle = faceColors[faceIndex];
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(projected[face[0]].x, projected[face[0]].y);
      for (let i = 1; i < face.length; i++) {
        ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  };

  const adjustBrightness = (color: string, factor: number) => {
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substring(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.substring(2, 4), 16) * factor);
    const b = Math.floor(parseInt(hex.substring(4, 6), 16) * factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const drawHand = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handX = canvas.width * 0.7;
    const handY = canvas.height * 0.8 + Math.sin(handAnimation) * 30;

    const skinColor = '#D2B48C';
    const blockColor = blockColors[selectedBlock];

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(handAnimation * 0.3);

    ctx.fillStyle = skinColor;
    ctx.fillRect(-20, 0, 40, 80);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(-20, 0, 40, 80);

    ctx.fillStyle = blockColor;
    ctx.fillRect(-30, -25, 35, 35);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(-30, -25, 35, 35);

    ctx.restore();
  };

  const drawWorld = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sortedBlocks = world
      .filter(block => {
        const dx = block.x - camera.x;
        const dz = block.z - camera.z;
        return Math.sqrt(dx * dx + dz * dz) < RENDER_DISTANCE;
      })
      .sort((a, b) => {
        const distA = Math.sqrt((a.x - camera.x) ** 2 + (a.z - camera.z) ** 2);
        const distB = Math.sqrt((b.x - camera.x) ** 2 + (b.z - camera.z) ** 2);
        return distB - distA;
      });

    sortedBlocks.forEach(block => {
      if (block.type !== 'air') {
        drawCube(ctx, block.x, block.y, block.z, blockColors[block.type]);
      }
    });

    drawHand(ctx);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pointerLocked) {
      requestPointerLock();
      return;
    }

    setIsSwinging(true);
    setHandAnimation(0);

    if (e.button === 0) {
      const item = inventory.find(i => i.type === selectedBlock);
      if (item && item.count > 0) {
        const forward = {
          x: Math.sin(camera.yaw) * Math.cos(camera.pitch),
          y: -Math.sin(camera.pitch),
          z: Math.cos(camera.yaw) * Math.cos(camera.pitch)
        };
        
        const distance = 3;
        const placeX = Math.round(camera.x + forward.x * distance);
        const placeY = Math.round(camera.y + forward.y * distance);
        const placeZ = Math.round(camera.z + forward.z * distance);

        const exists = world.some(b => b.x === placeX && b.y === placeY && b.z === placeZ);
        if (!exists) {
          setWorld([...world, { type: selectedBlock, x: placeX, y: placeY, z: placeZ }]);
          setInventory(inventory.map(i => 
            i.type === selectedBlock ? { ...i, count: i.count - 1 } : i
          ));
          toast.success(`Размещен блок: ${blockLabels[selectedBlock]}`);
        }
      } else {
        toast.error('Недостаточно блоков!');
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    if (!pointerLocked) return;

    const forward = {
      x: Math.sin(camera.yaw) * Math.cos(camera.pitch),
      y: -Math.sin(camera.pitch),
      z: Math.cos(camera.yaw) * Math.cos(camera.pitch)
    };
    
    for (let dist = 1; dist <= 5; dist += 0.5) {
      const targetX = Math.round(camera.x + forward.x * dist);
      const targetY = Math.round(camera.y + forward.y * dist);
      const targetZ = Math.round(camera.z + forward.z * dist);
      
      const blockIndex = world.findIndex(b => b.x === targetX && b.y === targetY && b.z === targetZ);
      if (blockIndex !== -1) {
        const removedBlock = world[blockIndex];
        setWorld(world.filter((_, i) => i !== blockIndex));
        setInventory(inventory.map(i => 
          i.type === removedBlock.type ? { ...i, count: i.count + 1 } : i
        ));
        toast.success(`Удален блок: ${blockLabels[removedBlock.type]}`);
        setIsSwinging(true);
        setHandAnimation(0);
        break;
      }
    }
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setHealth(100);
    setHunger(100);
    toast.success(`Запущен режим: ${getModeLabel(mode)}`);
  };

  const joinServer = (server: ServerName) => {
    setSelectedServer(server);
    setGameMode('creative');
    toast.success(`Подключение к серверу ${server.toUpperCase()}...`);
  };

  const getModeLabel = (mode: GameMode) => {
    const labels = {
      menu: 'Меню',
      creative: 'Творчество',
      survival: 'Выживание',
      hardcore: 'Хардкор',
      adventure: 'Приключения',
      pvp: 'PvP',
      servers: 'Серверы'
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
              onClick={() => setGameMode('servers')}
              className="h-16 text-lg bg-muted hover:bg-muted/90 border-4 border-black shadow-pixel md:col-span-2"
            >
              <Icon name="Server" className="mr-2" size={20} />
              Мультиплеер
            </Button>
          </div>
          <div className="mt-8 space-y-2 text-sm opacity-75">
            <p className="text-center font-bold">Управление:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>• WASD - Движение</div>
              <div>• Мышь - Обзор (клик для захвата)</div>
              <div>• Пробел - Вверх</div>
              <div>• Shift - Вниз</div>
              <div>• ЛКМ - Поставить блок</div>
              <div>• ПКМ - Убрать блок</div>
              <div>• E - Инвентарь</div>
              <div>• ESC - Выйти из игры</div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (gameMode === 'servers') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-sky-600 p-4">
        <Card className="p-8 bg-card border-4 border-black shadow-pixel max-w-3xl w-full">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl text-primary">СЕРВЕРЫ</h1>
            <Button 
              onClick={() => setGameMode('menu')}
              className="bg-destructive border-4 border-black shadow-pixel"
              size="sm"
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Назад
            </Button>
          </div>
          
          <div className="space-y-4">
            <Card className="p-6 border-4 border-black hover:scale-102 transition-transform cursor-pointer" onClick={() => joinServer('funtime')}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-2">🎮 FunTime</h3>
                  <p className="text-sm opacity-75">Деревня • Выживание • 1000+ игроков</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-primary/20 px-2 py-1 rounded">Мини-игры</span>
                    <span className="text-xs bg-accent/20 px-2 py-1 rounded">Креатив</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-pixel mb-2"></div>
                  <span className="text-xs">Онлайн</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-4 border-black hover:scale-102 transition-transform cursor-pointer opacity-50" onClick={() => toast('Сервер в разработке!')}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">⚔️ Hypixel</h3>
                  <p className="text-sm opacity-75">BedWars • SkyBlock • 50000+ игроков</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-primary/20 px-2 py-1 rounded">PvP</span>
                    <span className="text-xs bg-destructive/20 px-2 py-1 rounded">Хардкор</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mb-2"></div>
                  <span className="text-xs">Скоро</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-4 border-black hover:scale-102 transition-transform cursor-pointer opacity-50" onClick={() => toast('Сервер в разработке!')}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">🏰 Mineplex</h3>
                  <p className="text-sm opacity-75">Замки • Приключения • 5000+ игроков</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-secondary/20 px-2 py-1 rounded">RPG</span>
                    <span className="text-xs bg-accent/20 px-2 py-1 rounded">Квесты</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-red-500 rounded-full mb-2"></div>
                  <span className="text-xs">Оффлайн</span>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-400 relative overflow-hidden">
      {!pointerLocked && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8 border-4 border-black shadow-pixel text-center">
            <h2 className="text-2xl mb-4">Нажмите для игры</h2>
            <p className="text-sm mb-4 opacity-75">ESC - выход из режима захвата мыши</p>
            <Button onClick={requestPointerLock} className="border-4 border-black shadow-pixel">
              <Icon name="MousePointer2" className="mr-2" />
              Начать
            </Button>
          </Card>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 flex gap-4">
        <Button 
          onClick={() => {
            exitPointerLock();
            setGameMode('menu');
          }}
          className="bg-destructive border-4 border-black shadow-pixel"
          size="sm"
        >
          <Icon name="Home" size={16} />
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

      <div className="flex items-center justify-center min-h-screen">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onClick={handleCanvasClick}
          onContextMenu={handleContextMenu}
          className="border-8 border-black shadow-pixel cursor-crosshair"
        />
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-6 h-0.5 bg-white shadow-lg"></div>
        <div className="w-0.5 h-6 bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-card/95 p-2 border-4 border-black shadow-pixel">
        <div className="flex gap-2">
          {inventory.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedBlock(item.type);
                toast.success(`Выбран: ${blockLabels[item.type]}`);
              }}
              className={`w-14 h-14 border-4 border-black flex flex-col items-center justify-center transition-all hover:scale-110 relative ${
                selectedBlock === item.type ? 'ring-4 ring-white scale-110' : ''
              }`}
              style={{ backgroundColor: blockColors[item.type] }}
              title={blockLabels[item.type]}
            >
              <span className="text-[10px] font-bold absolute top-0 left-1 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                {index + 1}
              </span>
              <span className="text-xs font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <div className="text-xs bg-card/90 p-3 border-2 border-black shadow-pixel">
          <div className="font-bold mb-1">
            {selectedServer ? `Сервер: ${selectedServer.toUpperCase()}` : `Режим: ${getModeLabel(gameMode)}`}
          </div>
          <div className="text-[10px] opacity-75">
            Блок: {blockLabels[selectedBlock]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;