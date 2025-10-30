import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'air' | 'planks' | 'cobblestone';

interface InventoryItem {
  type: BlockType;
  count: number;
}

interface Recipe {
  id: string;
  result: BlockType;
  resultCount: number;
  ingredients: { type: BlockType; count: number }[];
  name: string;
}

interface InventoryMenuProps {
  inventory: InventoryItem[];
  selectedBlock: BlockType;
  onSelectBlock: (type: BlockType) => void;
  onClose: () => void;
  onCraft: (recipe: Recipe) => void;
  blockColors: Record<BlockType, string>;
  blockLabels: Record<BlockType, string>;
}

const recipes: Recipe[] = [
  {
    id: 'planks',
    result: 'planks',
    resultCount: 4,
    ingredients: [{ type: 'wood', count: 1 }],
    name: 'Доски'
  },
  {
    id: 'cobblestone_to_stone',
    result: 'stone',
    resultCount: 1,
    ingredients: [{ type: 'cobblestone', count: 1 }],
    name: 'Камень'
  }
];

const InventoryMenu = ({
  inventory,
  selectedBlock,
  onSelectBlock,
  onClose,
  onCraft,
  blockColors,
  blockLabels
}: InventoryMenuProps) => {
  const canCraft = (recipe: Recipe) => {
    return recipe.ingredients.every(ingredient => {
      const item = inventory.find(i => i.type === ingredient.type);
      return item && item.count >= ingredient.count;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <Card className="p-6 bg-card border-4 border-black shadow-pixel max-w-4xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">ИНВЕНТАРЬ</h2>
          <Button
            onClick={onClose}
            className="bg-destructive border-4 border-black shadow-pixel"
            size="sm"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col items-center gap-4">
            <div className="text-sm font-bold mb-2">ВАШ ПЕРСОНАЖ</div>
            <div className="w-32 h-48 bg-gradient-to-b from-primary to-primary/80 border-4 border-black shadow-pixel relative">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-[#D2B48C] border-2 border-black"></div>
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-20 h-24 bg-primary border-2 border-black"></div>
              <div className="absolute top-20 left-2 w-4 h-20 bg-primary/90 border-2 border-black"></div>
              <div className="absolute top-20 right-2 w-4 h-20 bg-primary/90 border-2 border-black"></div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 -ml-3 w-6 h-12 bg-primary/80 border-2 border-black"></div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 ml-3 w-6 h-12 bg-primary/80 border-2 border-black"></div>
            </div>
            <div className="text-xs opacity-75">Уровень: 1</div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-sm font-bold mb-3">ПРЕДМЕТЫ</h3>
              <div className="grid grid-cols-4 gap-2">
                {inventory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectBlock(item.type)}
                    className={`aspect-square border-4 border-black flex flex-col items-center justify-center transition-all hover:scale-105 relative ${
                      selectedBlock === item.type ? 'ring-4 ring-white scale-105' : ''
                    }`}
                    style={{ backgroundColor: blockColors[item.type] }}
                    title={blockLabels[item.type]}
                  >
                    <span className="text-xs font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                      {item.count}
                    </span>
                    <span className="text-[10px] text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,1)] mt-1">
                      {blockLabels[item.type]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3">КРАФТ</h3>
              <div className="grid grid-cols-2 gap-3">
                {recipes.map(recipe => {
                  const craftable = canCraft(recipe);
                  return (
                    <Card
                      key={recipe.id}
                      className={`p-3 border-4 border-black transition-all ${
                        craftable
                          ? 'hover:scale-105 cursor-pointer bg-card'
                          : 'opacity-50 cursor-not-allowed bg-muted'
                      }`}
                      onClick={() => craftable && onCraft(recipe)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {recipe.ingredients.map((ing, idx) => (
                            <div
                              key={idx}
                              className="w-10 h-10 border-2 border-black flex items-center justify-center text-[10px]"
                              style={{ backgroundColor: blockColors[ing.type] }}
                            >
                              {ing.count}
                            </div>
                          ))}
                        </div>
                        <Icon name="ArrowRight" size={16} />
                        <div
                          className="w-12 h-12 border-2 border-black flex items-center justify-center font-bold"
                          style={{ backgroundColor: blockColors[recipe.result] }}
                        >
                          {recipe.resultCount}
                        </div>
                      </div>
                      <div className="text-xs mt-2 text-center">{recipe.name}</div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-center opacity-75">
          Нажмите E чтобы закрыть инвентарь
        </div>
      </Card>
    </div>
  );
};

export default InventoryMenu;
