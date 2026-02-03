import HeroBanner from '@/components/HeroBanner';
import ContentRow from '@/components/ContentRow';
import TopSection from '@/components/TopSection';
import TopMoviesSection from '@/components/TopMoviesSection';
import TopAnimesSection from '@/components/TopAnimesSection';
import MobileHeroBanner from '@/components/MobileHeroBanner';
import MobileCircleSlider from '@/components/MobileCircleSlider';
import MobileTopSection from '@/components/MobileTopSection';
import MobileContentSection from '@/components/MobileContentSection';
import CollectionsScroll from '@/components/CollectionsScroll';
import HomeWatchHistory from '@/components/HomeWatchHistory';
import HomeContinuousWatch from '@/components/HomeContinuousWatch';
import { UpcomingSection } from '@/components/UpcomingSection';
import AdSlot from '@/components/ads/AdSlot';
import SeriesUpdateTodaySection from '@/components/SeriesUpdateTodaySection';
import TopCelebritiesSection from '@/components/TopCelebritiesSection';
import PinnedSeriesSection from '@/components/PinnedSeriesSection';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsIPad } from '@/hooks/use-ipad';
import { useHomeSections } from '@/hooks/useHomeSections';
import React from 'react';

// Section component mapping for web
const webSectionComponents: Record<string, React.FC<{ className?: string }>> = {
  hero_banner: () => <HeroBanner page="home" />,
  pinned_series: ({ className }) => <PinnedSeriesSection className={className || "px-0 mx-[15px]"} />,
  top_section: ({ className }) => <TopSection className={className || "px-0 mx-[15px]"} />,
  series_update_today: ({ className }) => <SeriesUpdateTodaySection className={className || "px-[15px]"} />,
  top_animes: ({ className }) => <TopAnimesSection className={className || "mx-[15px] px-[15px]"} />,
  watch_history: () => <HomeWatchHistory />,
  continuous_watch: () => <HomeContinuousWatch />,
  top_movies: ({ className }) => <TopMoviesSection className={className || "px-[15px] mx-[15px]"} />,
  top_celebrities: ({ className }) => <TopCelebritiesSection className={className || "mx-[15px]"} />,
  upcoming: ({ className }) => <UpcomingSection className={className || "mx-[15px] px-0"} />,
  collections: () => <CollectionsScroll />,
  trending: ({ className }) => <ContentRow title="Trending Now" className={className || "px-[15px] mx-[15px]"} />,
  new_releases: ({ className }) => <ContentRow title="New Releases" className={className || "px-[15px] mx-[15px]"} />,
};

// Section component mapping for mobile
const mobileSectionComponents: Record<string, React.FC<{ className?: string }>> = {
  hero_banner: () => <MobileHeroBanner page="home" />,
  circle_slider: () => <MobileCircleSlider />,
  continuous_watch: () => <HomeContinuousWatch />,
  pinned_series: () => <PinnedSeriesSection />,
  top_section: () => <MobileTopSection />,
  series_update_today: () => <SeriesUpdateTodaySection />,
  top_animes: ({ className }) => <TopAnimesSection className={className || "px-4"} />,
  watch_history: () => <HomeWatchHistory />,
  top_movies: ({ className }) => <TopMoviesSection className={className || "px-4"} />,
  top_celebrities: ({ className }) => <TopCelebritiesSection className={className || "px-4"} />,
  trending: () => <MobileContentSection title="Trending Now" type="trending" link="/movies" />,
  new_releases: () => <MobileContentSection title="New Releases" type="new_releases" link="/movies" />,
  upcoming: () => <UpcomingSection />,
  collections: () => <CollectionsScroll />,
};

const Home = () => {
  const isMobile = useIsMobile();
  const { isIPadPortrait } = useIsIPad();
  const { sections, isVisibleWeb, isVisibleMobile, loading } = useHomeSections();

  // Mobile layout: mobile devices OR iPad in portrait mode
  const useMobileLayout = isMobile || isIPadPortrait;

  if (loading) {
    return <div className="min-h-screen" />;
  }

  if (useMobileLayout) {
    return (
      <div className="min-h-screen scrollbar-hide">
        {sections.map((section) => {
          if (!isVisibleMobile(section.section_key)) return null;
          
          const Component = mobileSectionComponents[section.section_key];
          if (!Component) return null;
          
          return <Component key={section.id} />;
        })}
        <AdSlot placement="banner" pageLocation="home_top_series" className="px-4 py-2" />
        <AdSlot placement="banner" pageLocation="home_collections" className="px-4 py-2" />
      </div>
    );
  }

  // Desktop Layout (also used for iPad landscape)
  return (
    <div className="pb-8">
      <div className="space-y-6">
        {sections.map((section) => {
          if (!isVisibleWeb(section.section_key)) return null;
          
          const Component = webSectionComponents[section.section_key];
          if (!Component) return null;
          
          return <Component key={section.id} />;
        })}
      </div>
      <AdSlot placement="banner" pageLocation="home_top_series" className="px-4" />
      <AdSlot placement="banner" pageLocation="home_collections" className="px-4" />
      <AdSlot placement="banner" pageLocation="home_new_releases" className="px-4" />
    </div>
  );
};

export default Home;
