import { ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { triggerSelectionHaptic, triggerToggleHaptic } from './haptics';

interface SettingsMenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  onClick?: () => void;
  hasSubmenu?: boolean;
}

export const SettingsMenuItem = ({ 
  icon: Icon, 
  label, 
  value, 
  onClick, 
  hasSubmenu = false 
}: SettingsMenuItemProps) => {
  const handleClick = () => {
    triggerSelectionHaptic();
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 active:bg-white/15 transition-colors text-left outline-none focus-visible:bg-white/10 touch-manipulation select-none"
    >
      <Icon className="h-5 w-5 text-white/70 flex-shrink-0" />
      <span className="flex-1 text-sm text-white font-medium">{label}</span>
      {value && (
        <span className="text-sm text-white/50 flex-shrink-0 max-w-[100px] truncate">{value}</span>
      )}
      {hasSubmenu && (
        <ChevronRight className="h-4 w-4 text-white/40 flex-shrink-0" />
      )}
    </button>
  );
};

interface SettingsToggleItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const SettingsToggleItem = ({ 
  icon: Icon, 
  label, 
  checked, 
  onCheckedChange 
}: SettingsToggleItemProps) => {
  const handleClick = () => {
    triggerToggleHaptic();
    onCheckedChange(!checked);
  };

  return (
    <div 
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors cursor-pointer touch-manipulation select-none"
      onClick={handleClick}
    >
      <Icon className="h-5 w-5 text-white/70 flex-shrink-0" />
      <span className="flex-1 text-sm text-white font-medium">{label}</span>
      <Switch 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-white/20 pointer-events-none"
      />
    </div>
  );
};
