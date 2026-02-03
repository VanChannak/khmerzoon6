import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TranslationCache {
  [key: string]: {
    [language: string]: string;
  };
}

// Simple in-memory cache for translations
const translationCache: TranslationCache = {};

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const translateText = useCallback(async (
    text: string,
    targetLanguage: string = 'km'
  ): Promise<string | null> => {
    if (!text || text.trim().length === 0) {
      return null;
    }

    // Create a cache key from the first 50 chars of text
    const cacheKey = text.substring(0, 50);

    // Check cache first
    if (translationCache[cacheKey]?.[targetLanguage]) {
      return translationCache[cacheKey][targetLanguage];
    }

    setIsTranslating(true);

    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text, targetLanguage },
      });

      if (error) {
        console.error('Translation error:', error);
        toast({
          title: 'Translation Failed',
          description: error.message || 'Could not translate the text. Please try again.',
          variant: 'destructive',
        });
        return null;
      }

      if (data?.translatedText) {
        // Cache the translation
        if (!translationCache[cacheKey]) {
          translationCache[cacheKey] = {};
        }
        translationCache[cacheKey][targetLanguage] = data.translatedText;
        
        return data.translatedText;
      }

      return null;
    } catch (err) {
      console.error('Translation error:', err);
      toast({
        title: 'Translation Failed',
        description: 'Could not translate the text. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, [toast]);

  return {
    translateText,
    isTranslating,
  };
};
