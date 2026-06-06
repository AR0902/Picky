import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, GestureHandlerRootView, Gesture } from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');
const POSTER_H = height * 0.54;
const DETAIL_POSTER_H = height * 0.44;
const SHEET_OVERLAP = 32;

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#07070A',
  s1: '#0D0D15',
  s2: '#131320',
  s3: '#1A1A28',
  s4: '#1F1D2E',
  borderFaint: 'rgba(255,255,255,0.055)',
  border: 'rgba(255,255,255,0.09)',
  borderBright: 'rgba(255,255,255,0.16)',
  text: '#EEEEF2',
  sub: '#8686A2',
  muted: '#4E4E66',
  gold: '#F2B84B',
  goldDim: 'rgba(242,184,75,0.14)',
  accent: '#A48CFF',
  accentDim: 'rgba(164,140,255,0.13)',
  green: '#4ADE80',
  greenDim: 'rgba(74,222,128,0.11)',
  white: '#EDEDF1',
};

const R = { xs: 10, sm: 16, md: 20, lg: 28, xl: 36, pill: 999 };

// ─── Types ────────────────────────────────────────────────────────────────────

type Movie = {
  id: string;
  title: string;
  year: string;
  genre: string;
  moods: string[];
  score: number;
  runtime: number;
  poster: string;
  synopsis: string;
  director: string;
  cast: string[];
};

type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
};

type Prefs = {
  moods: string[];
  genres: string[];
  runtime: 'any' | 'short' | 'medium' | 'long';
  minScore: number;
};

type Screen = 'prefs' | 'main';
type TabKey = 'recs' | 'account';
type LibraryTab = 'watchlist' | 'watched' | 'favorites';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOODS = ['Chill', 'Intense', 'Romantic', 'Dark', 'Funny', 'Inspiring'];
const GENRES = ['Drama', 'Romance', 'Thriller', 'Comedy', 'Horror', 'Sci-Fi', 'Animation'];

const RUNTIME_OPTIONS: { key: Prefs['runtime']; label: string }[] = [
  { key: 'any', label: 'Any' },
  { key: 'short', label: '< 90m' },
  { key: 'medium', label: '90–120m' },
  { key: 'long', label: '2h+' },
];

const SCORE_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Any' },
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOVIES: Movie[] = [
  {
    id: '1', title: 'In the Mood for Love', year: '2000', genre: 'Romance',
    moods: ['Chill', 'Romantic'], score: 8.1, runtime: 98,
    poster: 'https://image.tmdb.org/t/p/w780/iYypPT4bhqXfq1b8PVzB5m9x8qv.jpg',
    synopsis: 'Two married neighbors in 1962 Hong Kong develop a profound, unspoken connection after discovering their spouses are having an affair. A masterpiece of restraint and longing.',
    director: 'Wong Kar-wai',
    cast: ['Tony Leung', 'Maggie Cheung', 'Rebecca Pan'],
  },
  {
    id: '2', title: 'Decision to Leave', year: '2022', genre: 'Thriller',
    moods: ['Intense', 'Romantic'], score: 7.4, runtime: 138,
    poster: 'https://image.tmdb.org/t/p/w780/5r0yhJgR2xDkQ6M6lMd3U0M4xZK.jpg',
    synopsis: 'A detective begins to suspect and then becomes obsessively fascinated by the widow of a man who fell from a mountain. Park Chan-wook at his most seductive.',
    director: 'Park Chan-wook',
    cast: ['Park Hae-il', 'Tang Wei', 'Go Kyung-pyo'],
  },
  {
    id: '3', title: 'Drive My Car', year: '2021', genre: 'Drama',
    moods: ['Chill', 'Inspiring'], score: 7.9, runtime: 179,
    poster: 'https://image.tmdb.org/t/p/w780/6B12mY3AAgbJ0P9mAabqK6f4e4V.jpg',
    synopsis: 'A stage actor and director processes grief when he is assigned a young chauffeur for a months-long theater residency. Based on Haruki Murakami, quiet and devastating.',
    director: 'Ryusuke Hamaguchi',
    cast: ['Hidetoshi Nishijima', 'Toko Miura', 'Reika Kirishima'],
  },
  {
    id: '4', title: 'Portrait of a Lady on Fire', year: '2019', genre: 'Romance',
    moods: ['Romantic', 'Inspiring'], score: 8.1, runtime: 122,
    poster: 'https://image.tmdb.org/t/p/w780/3NTAbAiao4JLzFQw6YxP1YZppM8.jpg',
    synopsis: 'A painter is commissioned to produce a wedding portrait for a woman who refuses to be painted, and the two fall into a forbidden love. A fiercely beautiful film.',
    director: 'Celine Sciamma',
    cast: ['Noémie Merlant', 'Adèle Haenel', 'Luàna Bajrami'],
  },
  {
    id: '5', title: 'Perfect Blue', year: '1997', genre: 'Animation',
    moods: ['Intense', 'Dark'], score: 8.0, runtime: 81,
    poster: 'https://image.tmdb.org/t/p/w780/8TE2mVasUf6I9cQOQim2T8dS9zf.jpg',
    synopsis: 'A pop idol quits her group to become an actress, but her sense of reality unravels as a sinister doppelganger stalks her. Satoshi Kon\'s defining psychological thriller.',
    director: 'Satoshi Kon',
    cast: ['Junko Iwao', 'Rica Matsumoto', 'Shinpachi Tsuji'],
  },
  {
    id: '6', title: 'Fallen Angels', year: '1995', genre: 'Drama',
    moods: ['Dark', 'Intense'], score: 7.5, runtime: 96,
    poster: 'https://image.tmdb.org/t/p/w780/hQ2aT3f7mW4qNqV6N2s6P8qG8YV.jpg',
    synopsis: 'Two interconnected stories follow a hitman and his obsessive partner alongside a mute ex-convict navigating Hong Kong\'s neon-lit underworld. Pure Wong Kar-wai atmosphere.',
    director: 'Wong Kar-wai',
    cast: ['Leon Lai', 'Michele Reis', 'Takeshi Kaneshiro'],
  },
  {
    id: '7', title: 'Amelie', year: '2001', genre: 'Romance',
    moods: ['Funny', 'Romantic', 'Inspiring'], score: 8.3, runtime: 122,
    poster: 'https://image.tmdb.org/t/p/w780/aVq0SsFNMOBBjLTiyRlC0iVxMR.jpg',
    synopsis: 'A shy Parisian woman decides to change the lives of those around her for the better while struggling to pursue her own happiness. Warm, inventive, and irresistible.',
    director: 'Jean-Pierre Jeunet',
    cast: ['Audrey Tautou', 'Mathieu Kassovitz', 'Rufus'],
  },
  {
    id: '8', title: 'Parasite', year: '2019', genre: 'Thriller',
    moods: ['Intense', 'Dark', 'Funny'], score: 8.5, runtime: 132,
    poster: 'https://image.tmdb.org/t/p/w780/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    synopsis: 'A destitute family schemes their way into the lives of a wealthy household, until an unexpected discovery sends everything spiraling. Bong Joon-ho\'s Palme d\'Or winner.',
    director: 'Bong Joon-ho',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'],
  },
  {
    id: '9', title: 'Spirited Away', year: '2001', genre: 'Animation',
    moods: ['Chill', 'Inspiring'], score: 8.5, runtime: 125,
    poster: 'https://image.tmdb.org/t/p/w780/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    synopsis: 'A ten-year-old girl wanders into a spirit world and must work to free herself and her transformed parents. Miyazaki\'s most beloved and imaginative creation.',
    director: 'Hayao Miyazaki',
    cast: ['Daveigh Chase', 'Suzanne Pleshette', 'Miyu Irino'],
  },
  {
    id: '10', title: 'Moonlight', year: '2016', genre: 'Drama',
    moods: ['Dark', 'Inspiring'], score: 7.4, runtime: 111,
    poster: 'https://image.tmdb.org/t/p/w780/qAwFbszpMSMrKoheozo7D7gCmjS.jpg',
    synopsis: 'Three chapters trace the life of Chiron, a Black man in Miami, as he searches for identity and connection across childhood, adolescence, and adulthood. Best Picture winner.',
    director: 'Barry Jenkins',
    cast: ['Mahershala Ali', 'Naomie Harris', 'Trevante Rhodes'],
  },
];

const REVIEWS: Record<string, Review[]> = {
  '1': [
    { id: '1a', author: 'Marcus T.', rating: 5, text: 'One of the most beautiful films ever made. Every frame could hang in a gallery.', date: 'Mar 2024' },
    { id: '1b', author: 'Yuna K.', rating: 5, text: 'Rewatched three times. The restraint makes the longing unbearable in the best way.', date: 'Jan 2024' },
    { id: '1c', author: 'Daniel R.', rating: 4, text: 'Slow and hypnotic. Not for everyone, but if it lands it really lands.', date: 'Nov 2023' },
  ],
  '2': [
    { id: '2a', author: 'Sofia M.', rating: 5, text: 'Park Chan-wook makes every shot feel like a painting. The ending floored me completely.', date: 'Apr 2024' },
    { id: '2b', author: 'James L.', rating: 4, text: 'The most compelling romance wrapped inside a thriller I have seen in years.', date: 'Feb 2024' },
    { id: '2c', author: 'Priya S.', rating: 4, text: 'Tang Wei is phenomenal. The film is dreamlike and I mean that as a compliment.', date: 'Dec 2023' },
  ],
  '3': [
    { id: '3a', author: 'Elena V.', rating: 5, text: 'Three hours and it felt like 90 minutes. A film that asks you to sit with grief.', date: 'Feb 2024' },
    { id: '3b', author: 'Tom H.', rating: 4, text: 'Hamaguchi is one of the best directors working today. Patient and devastating.', date: 'Jan 2024' },
  ],
  '4': [
    { id: '4a', author: 'Camille D.', rating: 5, text: 'A love story told with such precision and care. The gaze, the silence, all of it.', date: 'May 2024' },
    { id: '4b', author: 'Rin O.', rating: 5, text: 'Sciamma created something timeless. I think about this film constantly.', date: 'Mar 2024' },
    { id: '4c', author: 'Alex B.', rating: 4, text: 'Visually stunning with performances that speak volumes without a word.', date: 'Feb 2024' },
  ],
  '5': [
    { id: '5a', author: 'Kenji W.', rating: 5, text: 'Still holds up 27 years later. Satoshi Kon was decades ahead of his time.', date: 'Apr 2024' },
    { id: '5b', author: 'Rachel N.', rating: 5, text: 'Deeply unsettling and completely brilliant. The line between reality and fiction dissolves perfectly.', date: 'Jan 2024' },
    { id: '5c', author: 'Omar F.', rating: 4, text: 'Not a comfortable watch but an essential one. Nothing quite like it.', date: 'Nov 2023' },
  ],
  '6': [
    { id: '6a', author: 'Lily C.', rating: 4, text: 'Pure style and melancholy. Best experienced late at night with headphones.', date: 'Mar 2024' },
    { id: '6b', author: 'Noah K.', rating: 4, text: 'Less polished than his other films but the atmosphere is unmatched.', date: 'Dec 2023' },
  ],
  '7': [
    { id: '7a', author: 'Isabelle M.', rating: 5, text: 'Pure joy from start to finish. Audrey Tautou is magnetic.', date: 'Apr 2024' },
    { id: '7b', author: 'Sam G.', rating: 5, text: 'The film that made me fall in love with cinema. I revisit it every year.', date: 'Feb 2024' },
    { id: '7c', author: 'Hana T.', rating: 4, text: 'Whimsical and warm. Exactly what you need when the world feels heavy.', date: 'Jan 2024' },
  ],
  '8': [
    { id: '8a', author: 'Jin P.', rating: 5, text: 'Watched it twice in one day. The genre shifts are seamless and terrifying.', date: 'May 2024' },
    { id: '8b', author: 'Maria L.', rating: 5, text: 'Best screenplay in decades. Every scene pays off. Nothing wasted.', date: 'Mar 2024' },
    { id: '8c', author: 'Chris D.', rating: 5, text: 'The staircase. The stairs. You will know what I mean.', date: 'Feb 2024' },
  ],
  '9': [
    { id: '9a', author: 'Yuki A.', rating: 5, text: 'I grew up watching this. It still makes me cry. A perfect film.', date: 'Apr 2024' },
    { id: '9b', author: 'Lena B.', rating: 5, text: 'No other animated film has this much imagination packed into every frame.', date: 'Mar 2024' },
    { id: '9c', author: 'Finn O.', rating: 5, text: 'My kids love it, I love it, my parents love it. Genuinely timeless.', date: 'Jan 2024' },
  ],
  '10': [
    { id: '10a', author: 'Devon W.', rating: 5, text: 'The most tender film I have ever seen. Mahershala Ali breaks your heart effortlessly.', date: 'Apr 2024' },
    { id: '10b', author: 'Zara H.', rating: 5, text: 'Three chapters, one lifetime. Barry Jenkins understands how to show a soul.', date: 'Feb 2024' },
    { id: '10c', author: 'Miles J.', rating: 4, text: 'Quiet and devastating. The kind of film you carry with you for years.', date: 'Dec 2023' },
  ],
};

const DEFAULT_PREFS: Prefs = { moods: [], genres: [], runtime: 'any', minScore: 0 };

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('prefs');
  const [activeTab, setActiveTab] = useState<TabKey>('recs');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('watchlist');
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [watchedIds, setWatchedIds] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [recIndex, setRecIndex] = useState(0);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);

  const filteredQueue = useMemo(() => {
    return MOVIES.filter((m) => {
      if (watchedIds.includes(m.id)) return false;
      if (prefs.moods.length && !prefs.moods.some((mood) => m.moods.includes(mood))) return false;
      if (prefs.genres.length && !prefs.genres.includes(m.genre)) return false;
      if (prefs.runtime === 'short' && m.runtime >= 90) return false;
      if (prefs.runtime === 'medium' && (m.runtime < 90 || m.runtime > 120)) return false;
      if (prefs.runtime === 'long' && m.runtime <= 120) return false;
      if (m.score < prefs.minScore) return false;
      return true;
    });
  }, [prefs, watchedIds]);

  const currentRec = filteredQueue[recIndex] ?? null;

  const handleApplyPrefs = useCallback((p: Prefs) => {
    setPrefs(p);
    setRecIndex(0);
    setScreen('main');
  }, []);

  const handleSave = useCallback(() => {
    if (!currentRec) return;
    setSavedIds((prev) => (prev.includes(currentRec.id) ? prev : [...prev, currentRec.id]));
    setRecIndex((i) => i + 1);
  }, [currentRec]);

  const handleSkip = useCallback(() => setRecIndex((i) => i + 1), []);

  const handleMarkWatched = useCallback((id: string) => {
    setWatchedIds((prev) => [...prev, id]);
    setSavedIds((prev) => prev.filter((sid) => sid !== id));
  }, []);

  const handleRate = useCallback((id: string, stars: number) => {
    setRatings((prev) => ({ ...prev, [id]: stars }));
  }, []);

  const watchlist = useMemo(() => MOVIES.filter((m) => savedIds.includes(m.id)), [savedIds]);
  const watched = useMemo(() => MOVIES.filter((m) => watchedIds.includes(m.id)), [watchedIds]);
  const favorites = useMemo(() => watched.filter((m) => (ratings[m.id] ?? 0) >= 4), [watched, ratings]);

  const tabAnim = useRef(new Animated.Value(0)).current;
  const tabOpacity = useRef(new Animated.Value(1)).current;

  const handleTabChange = useCallback((newTab: TabKey) => {
    if (newTab === activeTab) return;
    const fromX = newTab === 'account' ? 32 : -32;
    tabAnim.setValue(fromX);
    tabOpacity.setValue(0);
    setActiveTab(newTab);
    Animated.parallel([
      Animated.spring(tabAnim, { toValue: 0, tension: 100, friction: 16, useNativeDriver: true }),
      Animated.timing(tabOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [activeTab, tabAnim, tabOpacity]);

  if (screen === 'prefs') {
    return <PreferencesScreen initialPrefs={prefs} onApply={handleApplyPrefs} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: tabAnim }], opacity: tabOpacity }}>
            {activeTab === 'recs' ? (
              <RecsScreen
                currentRec={currentRec}
                queueLength={filteredQueue.length}
                recIndex={recIndex}
                onSave={handleSave}
                onSkip={handleSkip}
                onOpenPrefs={() => setScreen('prefs')}
                onOpenDetail={setDetailMovie}
              />
            ) : (
              <AccountScreen
                libraryTab={libraryTab}
                onSetLibraryTab={setLibraryTab}
                watchlist={watchlist}
                watched={watched}
                favorites={favorites}
                ratings={ratings}
                onMarkWatched={handleMarkWatched}
                onRate={handleRate}
                onOpenDetail={setDetailMovie}
              />
            )}
          </Animated.View>
          <BottomTabs activeTab={activeTab} onChange={handleTabChange} />
        </View>

        <MovieDetailModal
          movie={detailMovie}
          visible={detailMovie !== null}
          ratings={ratings}
          watchedIds={watchedIds}
          onClose={() => setDetailMovie(null)}
          onRate={handleRate}
          onMarkWatched={handleMarkWatched}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ─── PreferencesScreen ────────────────────────────────────────────────────────

function PreferencesScreen({ initialPrefs, onApply }: { initialPrefs: Prefs; onApply: (p: Prefs) => void }) {
  const [draft, setDraft] = useState<Prefs>(initialPrefs);

  const toggleMood = (m: string) =>
    setDraft((p) => ({ ...p, moods: p.moods.includes(m) ? p.moods.filter((x) => x !== m) : [...p.moods, m] }));

  const toggleGenre = (g: string) =>
    setDraft((p) => ({ ...p, genres: p.genres.includes(g) ? p.genres.filter((x) => x !== g) : [...p.genres, g] }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.prefsScroll} contentContainerStyle={styles.prefsContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.prefsEyebrow}>PICKY</Text>
        <Text style={styles.prefsTitle}>What are you{'\n'}in the mood for?</Text>

        <FilterSection label="Vibe">
          {MOODS.map((m) => <Chip key={m} label={m} active={draft.moods.includes(m)} onPress={() => toggleMood(m)} />)}
        </FilterSection>
        <FilterSection label="Genre">
          {GENRES.map((g) => <Chip key={g} label={g} active={draft.genres.includes(g)} onPress={() => toggleGenre(g)} />)}
        </FilterSection>
        <FilterSection label="Runtime">
          {RUNTIME_OPTIONS.map(({ key, label }) => (
            <Chip key={key} label={label} active={draft.runtime === key} onPress={() => setDraft((p) => ({ ...p, runtime: key }))} />
          ))}
        </FilterSection>
        <FilterSection label="Min Score">
          {SCORE_OPTIONS.map(({ value, label }) => (
            <Chip key={value} label={label} active={draft.minScore === value} onPress={() => setDraft((p) => ({ ...p, minScore: value }))} />
          ))}
        </FilterSection>

        <Pressable
          style={({ pressed }) => [styles.findBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] }]}
          onPress={() => onApply(draft)}
        >
          <Text style={styles.findBtnText}>Find Movies</Text>
          <View style={styles.findBtnArrow}>
            <Ionicons name="arrow-forward" size={15} color={C.bg} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.chipWrap}>{children}</View>
    </View>
  );
}

// ─── RecsScreen ───────────────────────────────────────────────────────────────

type RecsScreenProps = {
  currentRec: Movie | null;
  queueLength: number;
  recIndex: number;
  onSave: () => void;
  onSkip: () => void;
  onOpenPrefs: () => void;
  onOpenDetail: (movie: Movie) => void;
};

function RecsScreen({ currentRec, queueLength, recIndex, onSave, onSkip, onOpenPrefs, onOpenDetail }: RecsScreenProps) {
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const isFirstRender = useRef(true);
  const SWIPE_THRESHOLD = 100;

  // Entrance animation whenever the card changes
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    translateX.value = width * 0.22;
    cardOpacity.value = 0;
    translateX.value = withSpring(0, { damping: 16, stiffness: 120 });
    cardOpacity.value = withTiming(1, { duration: 200 });
  }, [recIndex]);

  const exitCard = (dir: number, callback: () => void) => {
    translateX.value = withTiming(dir * (width + 100), { duration: 230 }, (done) => {
      if (done) {
        translateX.value = width * 0.22;
        cardOpacity.value = 0;
        runOnJS(callback)();
      }
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => { translateX.value = e.translationX; })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        exitCard(1, onSave);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        exitCard(-1, onSkip);
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${interpolate(translateX.value, [-200, 0, 200], [-8, 0, 8], Extrapolation.CLAMP)}deg` },
    ],
    opacity: cardOpacity.value,
  }));

  const saveIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const passIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.recsScreen}>
      <View style={styles.recsHeader}>
        <View>
          <Text style={styles.eyebrow}>PICKY</Text>
          <Text style={styles.screenTitle}>For You</Text>
        </View>
        <TouchableOpacity style={styles.filterIconBtn} onPress={onOpenPrefs} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={17} color={C.sub} />
        </TouchableOpacity>
      </View>

      {currentRec ? (
        <>
          <GestureDetector gesture={panGesture}>
            <Reanimated.View style={cardStyle}>
              <TouchableOpacity activeOpacity={0.93} onPress={() => onOpenDetail(currentRec)}>
                <View style={styles.posterShell}>
                  <View style={styles.posterCore}>
                    <Image source={{ uri: currentRec.poster }} style={styles.posterImage} />
                    <View style={styles.overlayBase} />
                    <View style={styles.overlayMid} />
                    <View style={styles.overlayBottom} />

                    <View style={styles.scoreBadge}>
                      <Ionicons name="star" size={10} color={C.gold} style={{ marginRight: 4 }} />
                      <Text style={styles.scoreBadgeText}>{currentRec.score.toFixed(1)}</Text>
                    </View>

                    {/* Swipe stamps */}
                    <Reanimated.View style={[styles.swipeStampSave, saveIndicatorStyle]}>
                      <Ionicons name="bookmark" size={14} color="#22c55e" />
                      <Text style={[styles.swipeStampText, { color: '#22c55e' }]}>SAVE</Text>
                    </Reanimated.View>
                    <Reanimated.View style={[styles.swipeStampPass, passIndicatorStyle]}>
                      <Ionicons name="close" size={14} color="#f87171" />
                      <Text style={[styles.swipeStampText, { color: '#f87171' }]}>PASS</Text>
                    </Reanimated.View>

                    <View style={styles.posterInfo}>
                      <View style={styles.genrePill}>
                        <Text style={styles.genrePillText}>{currentRec.genre.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.posterTitle}>{currentRec.title}</Text>
                      <Text style={styles.posterMeta}>{currentRec.year}  ·  {currentRec.runtime}m  ·  {currentRec.director}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Reanimated.View>
          </GestureDetector>

          <View style={styles.dotsRow}>
            {Array.from({ length: Math.min(queueLength, 7) }).map((_, i) => (
              <View key={i} style={[styles.dot, i === recIndex % 7 && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]}
              onPress={() => exitCard(-1, onSkip)}
            >
              <View style={styles.skipBtnInner}>
                <Ionicons name="close" size={20} color={C.sub} />
              </View>
              <Text style={styles.skipBtnText}>Pass</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }]}
              onPress={() => exitCard(1, onSave)}
            >
              <Ionicons name="bookmark" size={17} color={C.bg} />
              <Text style={styles.saveBtnText}>Save to list</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="film-outline" size={32} color={C.muted} />
          </View>
          <Text style={styles.emptyTitle}>That's everything</Text>
          <Text style={styles.emptyBody}>Loosen your filters to find more films.</Text>
          <Pressable
            style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
            onPress={onOpenPrefs}
          >
            <Text style={styles.emptyBtnText}>Update Filters</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── MovieDetailModal ─────────────────────────────────────────────────────────

type MovieDetailModalProps = {
  movie: Movie | null;
  visible: boolean;
  ratings: Record<string, number>;
  watchedIds: string[];
  onClose: () => void;
  onRate: (id: string, stars: number) => void;
  onMarkWatched: (id: string) => void;
};

function MovieDetailModal({ movie, visible, ratings, watchedIds, onClose, onRate, onMarkWatched }: MovieDetailModalProps) {
  if (!movie) return null;
  const reviews = REVIEWS[movie.id] ?? [];
  const userRating = ratings[movie.id] ?? 0;
  const isWatched = watchedIds.includes(movie.id);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={{ paddingBottom: 72 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Full-bleed poster */}
          <View style={styles.detailPosterWrap}>
            <Image source={{ uri: movie.poster }} style={styles.detailPoster} />
            <View style={styles.overlayBase} />
            <View style={[styles.overlayMid, { height: '75%' }]} />
            <View style={[styles.overlayBottom, { height: '55%', backgroundColor: 'rgba(0,0,0,0.72)' }]} />

            <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose} activeOpacity={0.75}>
              <Ionicons name="chevron-down" size={20} color={C.text} />
            </TouchableOpacity>

            <View style={styles.detailScoreBadge}>
              <Ionicons name="star" size={11} color={C.gold} style={{ marginRight: 4 }} />
              <Text style={styles.scoreBadgeText}>{movie.score.toFixed(1)}</Text>
            </View>
          </View>

          {/* Content sheet rises over the poster */}
          <View style={styles.detailSheet}>
            <View style={styles.sheetHandle} />

            {/* Title row */}
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>{movie.title}</Text>
              <View style={styles.sheetGenrePill}>
                <Text style={styles.sheetGenrePillText}>{movie.genre}</Text>
              </View>
            </View>

            {/* Meta row */}
            <View style={styles.sheetMetaRow}>
              <View style={styles.sheetMetaPill}>
                <Ionicons name="person-outline" size={11} color={C.muted} style={{ marginRight: 4 }} />
                <Text style={styles.sheetMetaText}>{movie.director}</Text>
              </View>
              <View style={styles.sheetMetaDot} />
              <View style={styles.sheetMetaPill}>
                <Ionicons name="time-outline" size={11} color={C.muted} style={{ marginRight: 4 }} />
                <Text style={styles.sheetMetaText}>{movie.runtime}m</Text>
              </View>
              <View style={styles.sheetMetaDot} />
              <View style={styles.sheetMetaPill}>
                <Text style={styles.sheetMetaText}>{movie.year}</Text>
              </View>
            </View>

            {/* Watched / Mark watched */}
            {isWatched ? (
              <View style={styles.watchedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={C.green} />
                <Text style={styles.watchedBadgeText}>You've watched this</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.markWatchedBtn, pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] }]}
                onPress={() => onMarkWatched(movie.id)}
              >
                <Ionicons name="checkmark-circle-outline" size={17} color={C.bg} />
                <Text style={styles.markWatchedBtnText}>Mark as Watched</Text>
              </Pressable>
            )}

            {/* Synopsis */}
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionLabel}>Synopsis</Text>
              <Text style={styles.sheetSynopsis}>{movie.synopsis}</Text>
            </View>

            {/* Cast - horizontal scroll */}
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionLabel}>Cast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
                {movie.cast.map((name) => (
                  <View key={name} style={styles.castChip}>
                    <View style={styles.castChipAvatar}>
                      <Text style={styles.castChipAvatarText}>{name[0]}</Text>
                    </View>
                    <Text style={styles.castChipText}>{name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Your rating */}
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionLabel}>Your Rating</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => onRate(movie.id, n)}
                    hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={n <= userRating ? 'star' : 'star-outline'}
                      size={32}
                      color={n <= userRating ? C.gold : C.s4}
                    />
                  </TouchableOpacity>
                ))}
                {userRating > 0 && (
                  <Text style={styles.ratingLabel}>{userRating}/5</Text>
                )}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.sheetDivider} />

            {/* Reviews */}
            <View style={styles.sheetSection}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sheetSectionLabel}>Audience Reviews</Text>
                <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
              </View>
              {reviews.length === 0 ? (
                <Text style={styles.noReviews}>No reviews yet.</Text>
              ) : (
                reviews.map((r) => <ReviewCard key={r.id} review={r} />)
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewAccent} />
      <View style={styles.reviewInner}>
        <View style={styles.reviewTopRow}>
          <View style={styles.reviewAvatar}>
            <Text style={styles.reviewAvatarText}>{review.author[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.reviewNameRow}>
              <Text style={styles.reviewAuthor}>{review.author}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
            <View style={styles.reviewStarsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Ionicons
                  key={n}
                  name={n <= review.rating ? 'star' : 'star-outline'}
                  size={11}
                  color={n <= review.rating ? C.gold : C.muted}
                />
              ))}
            </View>
          </View>
        </View>
        <Text style={styles.reviewText}>{review.text}</Text>
      </View>
    </View>
  );
}

// ─── AccountScreen ────────────────────────────────────────────────────────────

type AccountScreenProps = {
  libraryTab: LibraryTab;
  onSetLibraryTab: (t: LibraryTab) => void;
  watchlist: Movie[];
  watched: Movie[];
  favorites: Movie[];
  ratings: Record<string, number>;
  onMarkWatched: (id: string) => void;
  onRate: (id: string, stars: number) => void;
  onOpenDetail: (movie: Movie) => void;
};

function AccountScreen({ libraryTab, onSetLibraryTab, watchlist, watched, favorites, ratings, onMarkWatched, onRate, onOpenDetail }: AccountScreenProps) {
  const data = libraryTab === 'watchlist' ? watchlist : libraryTab === 'watched' ? watched : favorites;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.accountContent} showsVerticalScrollIndicator={false}>

      {/* Profile */}
      <View style={styles.profileSection}>
        <View style={styles.avatarRing}>
          <Text style={styles.avatarText}>P</Text>
        </View>
        <View>
          <Text style={styles.profileName}>@pickyuser</Text>
          <Text style={styles.profileTagline}>Collecting films worth the time.</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBlock label="Saved" value={watchlist.length.toString()} />
        <View style={styles.statDivider} />
        <StatBlock label="Watched" value={watched.length.toString()} />
        <View style={styles.statDivider} />
        <StatBlock label="Favorites" value={favorites.length.toString()} />
      </View>

      <View style={styles.librarySection}>
        <Text style={styles.sectionTitle}>Library</Text>
        <View style={styles.segmentedControl}>
          {(['watchlist', 'watched', 'favorites'] as LibraryTab[]).map((t) => (
            <SegmentButton
              key={t}
              label={t.charAt(0).toUpperCase() + t.slice(1)}
              active={libraryTab === t}
              onPress={() => onSetLibraryTab(t)}
            />
          ))}
        </View>

        {data.length === 0 ? (
          <View style={styles.emptyLibrary}>
            <Ionicons
              name={libraryTab === 'watchlist' ? 'bookmark-outline' : libraryTab === 'watched' ? 'checkmark-circle-outline' : 'heart-outline'}
              size={26}
              color={C.muted}
            />
            <Text style={styles.emptyLibraryText}>
              {libraryTab === 'watchlist'
                ? 'Save movies from your feed to build a watchlist.'
                : libraryTab === 'watched'
                ? 'Mark movies as watched and they will appear here.'
                : 'Rate a movie 4+ stars and it becomes a favorite.'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {data.map((m) => (
              <TouchableOpacity key={m.id} style={styles.gridItem} activeOpacity={0.88} onPress={() => onOpenDetail(m)}>
                <View style={styles.gridCard}>
                  <Image source={{ uri: m.poster }} style={styles.gridPoster} />
                  <View style={styles.gridOverlay} />
                  <View style={styles.gridScoreBadge}>
                    <Ionicons name="star" size={9} color={C.gold} />
                    <Text style={styles.gridScoreText}>{m.score.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.gridTitle} numberOfLines={1}>{m.title}</Text>
                <Text style={styles.gridMeta}>{m.year}  ·  {m.runtime}m</Text>
                {libraryTab === 'watchlist' && (
                  <TouchableOpacity
                    style={styles.gridWatchedBtn}
                    onPress={() => onMarkWatched(m.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="checkmark" size={12} color={C.sub} style={{ marginRight: 4 }} />
                    <Text style={styles.gridWatchedBtnText}>Watched</Text>
                  </TouchableOpacity>
                )}
                {libraryTab === 'watched' && (
                  <View style={styles.gridStarRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity key={n} onPress={() => onRate(m.id, n)} hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}>
                        <Ionicons
                          name={n <= (ratings[m.id] ?? 0) ? 'star' : 'star-outline'}
                          size={13}
                          color={n <= (ratings[m.id] ?? 0) ? C.gold : C.muted}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {active && <Ionicons name="checkmark" size={11} color={C.accent} style={{ marginRight: 4 }} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.segBtn, active && styles.segBtnActive]} onPress={onPress} activeOpacity={0.72}>
      <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function BottomTabs({ activeTab, onChange }: { activeTab: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <View style={styles.bottomTabs}>
      {([
        { key: 'recs', icon: 'film', iconOutline: 'film-outline', label: 'Recs' },
        { key: 'account', icon: 'person', iconOutline: 'person-outline', label: 'Profile' },
      ] as const).map(({ key, icon, iconOutline, label }) => {
        const active = activeTab === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, active && styles.tabBtnActive]}
            onPress={() => onChange(key)}
            activeOpacity={0.8}
          >
            <Ionicons name={active ? icon : iconOutline} size={19} color={active ? C.text : C.muted} />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1, paddingHorizontal: 18 },

  // ── Preferences ─────────────────────────────────────────────────────────────
  prefsScroll: { flex: 1, paddingHorizontal: 24 },
  prefsContent: { paddingTop: 36, paddingBottom: 64 },
  prefsEyebrow: { color: C.accent, fontSize: 10, fontWeight: '700', letterSpacing: 4, marginBottom: 16 },
  prefsTitle: { color: C.text, fontSize: 46, fontWeight: '800', lineHeight: 54, letterSpacing: -1.2, marginBottom: 44 },
  filterSection: { marginBottom: 32 },
  filterLabel: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: R.pill, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.s1,
  },
  chipActive: { backgroundColor: C.accentDim, borderColor: C.accent },
  chipText: { color: C.sub, fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: C.accent, fontWeight: '600' },

  findBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.white, paddingVertical: 18, paddingHorizontal: 28,
    borderRadius: R.md, marginTop: 8, gap: 12,
  },
  findBtnText: { color: C.bg, fontSize: 16, fontWeight: '800', letterSpacing: 0.1 },
  findBtnArrow: {
    width: 30, height: 30, borderRadius: R.pill,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Recs ────────────────────────────────────────────────────────────────────
  recsScreen: { flex: 1, paddingHorizontal: 16, paddingBottom: 110 },
  recsHeader: {
    paddingTop: 4, paddingBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  eyebrow: { color: C.accent, fontSize: 9, fontWeight: '700', letterSpacing: 4, marginBottom: 5 },
  screenTitle: { color: C.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  filterIconBtn: {
    width: 40, height: 40, borderRadius: R.sm,
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.borderFaint,
    alignItems: 'center', justifyContent: 'center',
  },

  posterShell: {
    height: POSTER_H, borderRadius: R.xl, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.s1, padding: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55, shadowRadius: 28, elevation: 12,
  },
  posterCore: { flex: 1, borderRadius: R.xl - 3, overflow: 'hidden', backgroundColor: C.s2 },
  posterImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  overlayBase: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.10)' },
  overlayMid: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', backgroundColor: 'rgba(0,0,0,0.40)' },
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', backgroundColor: 'rgba(0,0,0,0.55)' },

  scoreBadge: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: R.pill, borderWidth: 1, borderColor: 'rgba(242,184,75,0.25)',
  },
  scoreBadgeText: { color: C.gold, fontSize: 13, fontWeight: '700' },

  tapHint: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: R.pill,
  },
  tapHintText: { color: 'rgba(255,255,255,0.42)', fontSize: 11 },

  posterInfo: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 22 },
  genrePill: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(164,140,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(164,140,255,0.3)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill, marginBottom: 10,
  },
  genrePillText: { color: C.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  posterTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32, marginBottom: 6 },
  posterMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 0.2 },

  // Progress dots
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 14, marginBottom: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.s3 },
  dotActive: { width: 18, backgroundColor: C.accent },

  // Action row
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  skipBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, borderRadius: R.md,
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.border, gap: 6,
  },
  skipBtnInner: {
    width: 34, height: 34, borderRadius: R.pill,
    backgroundColor: C.s3, alignItems: 'center', justifyContent: 'center',
  },
  skipBtnText: { color: C.sub, fontSize: 13, fontWeight: '600' },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 17, borderRadius: R.md, backgroundColor: C.white,
  },
  saveBtnText: { color: C.bg, fontSize: 15, fontWeight: '800' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 14 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: R.xl,
    backgroundColor: C.s1, borderWidth: 1, borderColor: C.borderFaint,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { color: C.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  emptyBody: { color: C.sub, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 6, backgroundColor: C.s1,
    paddingHorizontal: 28, paddingVertical: 13, borderRadius: R.md,
    borderWidth: 1, borderColor: C.border,
  },
  emptyBtnText: { color: C.text, fontWeight: '700', fontSize: 14 },

  // ── Detail Modal ─────────────────────────────────────────────────────────────
  detailScroll: { flex: 1 },

  detailPosterWrap: { height: DETAIL_POSTER_H, position: 'relative', backgroundColor: C.s2 },
  detailPoster: { width: '100%', height: '100%', resizeMode: 'cover' },
  detailCloseBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 40, height: 40, borderRadius: R.pill,
    backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: C.borderFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  detailScoreBadge: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: R.pill, borderWidth: 1, borderColor: 'rgba(242,184,75,0.25)',
  },

  // Content sheet that rises over the poster
  detailSheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: SHEET_OVERLAP,
    borderTopRightRadius: SHEET_OVERLAP,
    marginTop: -SHEET_OVERLAP,
    paddingTop: 14,
    paddingHorizontal: 22,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginBottom: 22,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  sheetTitle: { flex: 1, color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, lineHeight: 34 },
  sheetGenrePill: {
    marginTop: 4, backgroundColor: C.accentDim,
    borderWidth: 1, borderColor: 'rgba(164,140,255,0.28)',
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: R.pill,
  },
  sheetGenrePillText: { color: C.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  sheetMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 22 },
  sheetMetaPill: { flexDirection: 'row', alignItems: 'center' },
  sheetMetaText: { color: C.muted, fontSize: 12, fontWeight: '500' },
  sheetMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.muted },

  markWatchedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.white, paddingVertical: 15, borderRadius: R.md, marginBottom: 8,
  },
  markWatchedBtnText: { color: C.bg, fontSize: 15, fontWeight: '800' },
  watchedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.greenDim, paddingVertical: 13, borderRadius: R.md,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
  },
  watchedBadgeText: { color: C.green, fontSize: 14, fontWeight: '600' },

  sheetSection: { marginTop: 28 },
  sheetSectionLabel: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12 },
  sheetSynopsis: { color: C.sub, fontSize: 15, lineHeight: 25 },
  sheetDivider: { height: 1, backgroundColor: C.borderFaint, marginTop: 32 },

  castChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.s1, borderRadius: R.pill,
    paddingRight: 14, paddingLeft: 4, paddingVertical: 4,
    borderWidth: 1, borderColor: C.borderFaint,
  },
  castChipAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center',
  },
  castChipAvatarText: { color: C.accent, fontSize: 12, fontWeight: '700' },
  castChipText: { color: C.sub, fontSize: 13, fontWeight: '500' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingLabel: { color: C.gold, fontSize: 14, fontWeight: '700', marginLeft: 4 },

  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  reviewCount: { color: C.muted, fontSize: 12 },
  noReviews: { color: C.muted, fontSize: 14 },

  reviewCard: {
    flexDirection: 'row', backgroundColor: C.s1,
    borderRadius: R.sm, marginBottom: 10,
    borderWidth: 1, borderColor: C.borderFaint, overflow: 'hidden',
  },
  reviewAccent: { width: 3, backgroundColor: C.gold },
  reviewInner: { flex: 1, padding: 14 },
  reviewTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { color: C.accent, fontSize: 13, fontWeight: '700' },
  reviewNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewAuthor: { color: C.text, fontSize: 13, fontWeight: '600' },
  reviewDate: { color: C.muted, fontSize: 11 },
  reviewStarsRow: { flexDirection: 'row', gap: 2 },
  reviewText: { color: C.sub, fontSize: 13, lineHeight: 20 },

  // ── Account ──────────────────────────────────────────────────────────────────
  accountContent: { paddingTop: 12, paddingBottom: 120 },

  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatarRing: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.accentDim, borderWidth: 2, borderColor: 'rgba(164,140,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: C.accent, fontSize: 22, fontWeight: '800' },
  profileName: { color: C.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.2, marginBottom: 3 },
  profileTagline: { color: C.muted, fontSize: 13 },

  statsRow: {
    flexDirection: 'row', backgroundColor: C.s1,
    borderRadius: R.md, paddingVertical: 18, marginBottom: 28,
    borderWidth: 1, borderColor: C.borderFaint,
  },
  statDivider: { width: 1, backgroundColor: C.borderFaint },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { color: C.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { color: C.muted, fontSize: 11, marginTop: 3, letterSpacing: 0.3 },

  librarySection: { gap: 0 },
  sectionTitle: { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 14 },
  segmentedControl: {
    flexDirection: 'row', backgroundColor: C.s1, borderRadius: R.sm,
    padding: 4, marginBottom: 20, borderWidth: 1, borderColor: C.borderFaint,
  },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: R.xs, alignItems: 'center' },
  segBtnActive: { backgroundColor: C.s3 },
  segBtnText: { color: C.muted, fontWeight: '600', fontSize: 13 },
  segBtnTextActive: { color: C.text },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 22 },
  gridItem: { width: (width - 18 * 2 - 12) / 2 },
  gridCard: {
    borderRadius: R.sm, overflow: 'hidden', backgroundColor: C.s2,
    marginBottom: 8, borderWidth: 1, borderColor: C.borderFaint,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  gridPoster: { width: '100%', height: 210, resizeMode: 'cover' },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', backgroundColor: 'rgba(0,0,0,0.45)' },
  gridScoreBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 7, paddingVertical: 4,
    borderRadius: R.pill,
  },
  gridScoreText: { color: C.gold, fontSize: 11, fontWeight: '700' },
  gridTitle: { color: C.text, fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  gridMeta: { color: C.muted, fontSize: 11, marginTop: 2, marginBottom: 6 },
  gridWatchedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.s2, paddingVertical: 6, borderRadius: R.xs,
    borderWidth: 1, borderColor: C.borderFaint,
  },
  gridWatchedBtnText: { color: C.sub, fontSize: 11, fontWeight: '600' },
  gridStarRow: { flexDirection: 'row', gap: 3 },

  emptyLibrary: { paddingVertical: 56, alignItems: 'center', paddingHorizontal: 28, gap: 12 },
  emptyLibraryText: { color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 21 },

  // ── Bottom Tabs ──────────────────────────────────────────────────────────────
  bottomTabs: {
    position: 'absolute', left: 18, right: 18, bottom: 20,
    backgroundColor: C.s1, borderRadius: R.md, flexDirection: 'row',
    padding: 6, borderWidth: 1, borderColor: C.borderFaint,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 10,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: R.sm, gap: 4 },
  tabBtnActive: { backgroundColor: C.s4 },
  tabText: { color: C.muted, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: C.text },

  // ── Swipe stamps ─────────────────────────────────────────────────────────────
  swipeStampSave: {
    position: 'absolute', top: 22, left: 18,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: R.xs, borderWidth: 2, borderColor: '#22c55e',
    transform: [{ rotate: '-12deg' }],
  },
  swipeStampPass: {
    position: 'absolute', top: 22, right: 18,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(248,113,113,0.12)',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: R.xs, borderWidth: 2, borderColor: '#f87171',
    transform: [{ rotate: '12deg' }],
  },
  swipeStampText: {
    fontSize: 13, fontWeight: '900', letterSpacing: 1.5,
  },
});
