import { ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerSelectionHaptic } from './haptics';

interface SettingsSubmenuHeaderProps {
  title: string;
  onBack: () => void;
}

export const SettingsSubmenuHeader = ({ title, onBack }: SettingsSubmenuHeaderProps) => {
  const handleBack = () => {
    triggerSelectionHaptic();
    onBack();
  };

  return (
    <button
      onClick={handleBack}
      className="w-full flex items-center gap-2 px-4 py-3 border-b border-white/10 hover:bg-white/10 active:bg-white/15 transition-colors outline-none focus-visible:bg-white/10 touch-manipulation select-none"
    >
      <ChevronLeft className="h-5 w-5 text-white" />
      <span className="text-sm font-semibold text-white">{title}</span>
    </button>
  );
};

interface SettingsSubmenuItemProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  badge?: string;
}

export const SettingsSubmenuItem = ({ 
  label, 
  isSelected, 
  onClick,
  badge
}: SettingsSubmenuItemProps) => {
  const handleClick = () => {
    triggerSelectionHaptic();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 active:bg-white/15 transition-colors text-left outline-none focus-visible:bg-white/10 touch-manipulation select-none",
        isSelected && "bg-white/5"
      )}
    >
      <div className="w-5 flex justify-center flex-shrink-0">
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </div>
      <span className={cn("flex-1 text-sm", isSelected ? "text-white font-medium" : "text-white/80")}>{label}</span>
      {badge && (
        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">{badge}</span>
      )}
    </button>
  );
};
