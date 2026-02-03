import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Settings, Volume2, Monitor, Subtitles, Moon, Gauge, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsMenuItem, SettingsToggleItem } from './SettingsMenuItem';
import { SettingsSubmenuHeader, SettingsSubmenuItem } from './SettingsSubmenu';

interface VideoSettingsMenuProps {
  stableVolume: boolean;
  onStableVolumeChange: (enabled: boolean) => void;
  ambientMode?: boolean;
  onAmbientModeChange?: (enabled: boolean) => void;
  availableTextTracks: any[];
  currentTextTrack: string;
  onTextTrackChange: (language: string, role?: string) => void;
  sleepTimer: number;
  onSleepTimerChange: (minutes: number) => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  availableQualities: string[];
  currentQuality: string;
  autoQualityEnabled: boolean;
  onQualityChange: (quality: string) => void;
  onAutoQualityToggle: () => void;
  sourceType?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

type MenuView = 'main' | 'subtitles' | 'sleepTimer' | 'playbackSpeed' | 'quality';

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP_OPTIONS = [0, 15, 30, 45, 60, 90, 120];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

export const VideoSettingsMenu = ({
  stableVolume,
  onStableVolumeChange,
  ambientMode = false,
  onAmbientModeChange,
  availableTextTracks,
  currentTextTrack,
  onTextTrackChange,
  sleepTimer,
  onSleepTimerChange,
  playbackSpeed,
  onPlaybackSpeedChange,
  availableQualities,
  currentQuality,
  autoQualityEnabled,
  onQualityChange,
  onAutoQualityToggle,
  sourceType,
  onOpenChange
}: VideoSettingsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<MenuView>('main');
  const [direction, setDirection] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle open state changes
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
    if (!open) {
      // Reset to main menu after close animation
      setTimeout(() => setCurrentView('main'), 200);
    }
  }, [onOpenChange]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current && 
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        handleOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    document.addEventListener('touchstart', handleClickOutside, { capture: true, passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
      document.removeEventListener('touchstart', handleClickOutside, { capture: true });
    };
  }, [isOpen, handleOpenChange]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleOpenChange]);

  const navigateToSubmenu = useCallback((view: MenuView) => {
    setDirection(1);
    setCurrentView(view);
  }, []);

  const handleBack = useCallback(() => {
    setDirection(-1);
    setCurrentView('main');
  }, []);

  const toggleMenu = useCallback(() => {
    handleOpenChange(!isOpen);
  }, [isOpen, handleOpenChange]);

  const getQualityLabel = () => autoQualityEnabled ? `Auto (${currentQuality})` : currentQuality;
  const getSpeedLabel = () => playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`;

  const renderMainMenu = () => (
    <div className="py-1">
      <SettingsToggleItem
        icon={Volume2}
        label="Stable Volume"
        checked={stableVolume}
        onCheckedChange={onStableVolumeChange}
      />

      {onAmbientModeChange && (
        <SettingsToggleItem
          icon={Monitor}
          label="Ambient Mode"
          checked={ambientMode}
          onCheckedChange={onAmbientModeChange}
        />
      )}

      {availableTextTracks.length > 0 && (
        <SettingsMenuItem
          icon={Subtitles}
          label="Subtitles"
          value={currentTextTrack === 'off' ? 'Off' : currentTextTrack}
          onClick={() => navigateToSubmenu('subtitles')}
          hasSubmenu
        />
      )}

      <SettingsMenuItem
        icon={Moon}
        label="Sleep Timer"
        value={sleepTimer === 0 ? 'Off' : `${sleepTimer}m`}
        onClick={() => navigateToSubmenu('sleepTimer')}
        hasSubmenu
      />

      <SettingsMenuItem
        icon={Gauge}
        label="Speed"
        value={getSpeedLabel()}
        onClick={() => navigateToSubmenu('playbackSpeed')}
        hasSubmenu
      />

      {availableQualities.length > 0 && (
        <SettingsMenuItem
          icon={SlidersHorizontal}
          label="Quality"
          value={getQualityLabel()}
          onClick={() => navigateToSubmenu('quality')}
          hasSubmenu
        />
      )}
    </div>
  );

  const renderSubtitlesMenu = () => (
    <div>
      <SettingsSubmenuHeader title="Subtitles" onBack={handleBack} />
      <div className="py-1 max-h-[240px] overflow-y-auto overscroll-contain">
        <SettingsSubmenuItem
          label="Off"
          isSelected={currentTextTrack === 'off'}
          onClick={() => { onTextTrackChange('off'); handleBack(); }}
        />
        {availableTextTracks.map((track, idx) => (
          <SettingsSubmenuItem
            key={idx}
            label={track.language || `Track ${idx + 1}`}
            isSelected={currentTextTrack === track.language}
            onClick={() => { onTextTrackChange(track.language, track.role); handleBack(); }}
          />
        ))}
      </div>
    </div>
  );

  const renderSleepTimerMenu = () => (
    <div>
      <SettingsSubmenuHeader title="Sleep Timer" onBack={handleBack} />
      <div className="py-1">
        {SLEEP_OPTIONS.map((minutes) => (
          <SettingsSubmenuItem
            key={minutes}
            label={minutes === 0 ? 'Off' : `${minutes} minutes`}
            isSelected={sleepTimer === minutes}
            onClick={() => { onSleepTimerChange(minutes); handleBack(); }}
          />
        ))}
      </div>
    </div>
  );

  const renderPlaybackSpeedMenu = () => (
    <div>
      <SettingsSubmenuHeader title="Playback Speed" onBack={handleBack} />
      <div className="py-1 max-h-[240px] overflow-y-auto overscroll-contain">
        {SPEED_OPTIONS.map((speed) => (
          <SettingsSubmenuItem
            key={speed}
            label={speed === 1 ? 'Normal' : `${speed}x`}
            isSelected={playbackSpeed === speed}
            onClick={() => { onPlaybackSpeedChange(speed); handleBack(); }}
          />
        ))}
      </div>
    </div>
  );

  const renderQualityMenu = () => (
    <div>
      <SettingsSubmenuHeader title="Quality" onBack={handleBack} />
      <div className="py-1 max-h-[240px] overflow-y-auto overscroll-contain">
        <SettingsSubmenuItem
          label="Auto"
          isSelected={autoQualityEnabled}
          onClick={() => { onAutoQualityToggle(); handleBack(); }}
          badge={autoQualityEnabled ? currentQuality : undefined}
        />
        {availableQualities.map((quality) => (
          <SettingsSubmenuItem
            key={quality}
            label={quality}
            isSelected={currentQuality === quality && !autoQualityEnabled}
            onClick={() => { onQualityChange(quality); handleBack(); }}
            badge={quality.includes('1080') || quality.includes('720') ? 'HD' : undefined}
          />
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'subtitles': return renderSubtitlesMenu();
      case 'sleepTimer': return renderSleepTimerMenu();
      case 'playbackSpeed': return renderPlaybackSpeedMenu();
      case 'quality': return renderQualityMenu();
      default: return renderMainMenu();
    }
  };

  return (
    <div className="relative pointer-events-auto">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className={cn(
          "h-8 w-8 text-white hover:bg-white/10 hover:text-white active:bg-white/20 transition-all touch-manipulation",
          isOpen && "bg-white/10"
        )}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <Settings className={cn(
          "h-5 w-5 transition-transform duration-300 ease-out",
          isOpen && "rotate-90"
        )} />
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full right-0 mb-2 w-64 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[9999]"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="overflow-hidden">
              <AnimatePresence mode="popLayout" custom={direction}>
                <motion.div
                  key={currentView}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ 
                    duration: 0.2, 
                    ease: [0.32, 0.72, 0, 1]
                  }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoSettingsMenu;
