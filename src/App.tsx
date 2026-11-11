// App shell: hash router, bottom tab bar, global rest timer and theme.
import { useEffect, useState } from 'react';
import { useStore } from './db/store';
import { useT } from './i18n';
import { Icon } from './ui/kit';
import { RestBar, Summary } from './screens/Logger';
import { ExerciseScreen, LibraryScreen } from './screens/Library';
import { ProgramEditor, ProgramsScreen, TodayScreen } from './screens/Training';
import { LabScreen } from './screens/Lab';
import { DietScreen } from './screens/Diet';
import { PhotosScreen } from './screens/Photos';
import { MoreScreen, ScienceScreen } from './screens/More';
import { OnboardingScreen } from './screens/Onboarding';

const TABS = [
  { path: '', icon: 'dumbbell', label: 'tab.train' },
  { path: 'library', icon: 'book', label: 'tab.library' },
  { path: 'lab', icon: 'lab', label: 'tab.lab' },
  { path: 'diet', icon: 'food', label: 'tab.diet' },
  { path: 'more', icon: 'menu', label: 'tab.more' },
] as const;

function useHash(): string {
  const [h, setH] = useState(() => location.hash.replace(/^#\/?/, ''));
  useEffect(() => {
    const on = () => { setH(location.hash.replace(/^#\/?/, '')); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return h;
}

function useTheme(): void {
  const theme = useStore((s) => s.settings.theme);
  const lang = useStore((s) => s.settings.lang);
  useEffect(() => {
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0D0E11' : '#F3F4F6');
    };
    apply();
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme, lang]);
}

export function App() {
  useTheme();
  const t = useT();
  const hash = useHash();
  const hasProfile = useStore((s) => !!s.profile);
  const inSession = useStore((s) => !!s.active);
  const [route = '', param = ''] = hash.split('/');
  const id = decodeURIComponent(param);

  if (!hasProfile && route !== 'onboarding') return <div className="app"><OnboardingScreen /></div>;

  let screen: JSX.Element;
  let tab: string | null = null;
  switch (route) {
    case 'library': screen = <LibraryScreen />; tab = 'library'; break;
    case 'ex': screen = <ExerciseScreen id={id} />; tab = 'library'; break;
    case 'lab': screen = <LabScreen key={param} tab={param || 'volume'} />; tab = 'lab'; break;
    case 'diet': screen = <DietScreen />; tab = 'diet'; break;
    case 'more': screen = <MoreScreen />; tab = 'more'; break;
    case 'science': screen = <ScienceScreen />; tab = 'more'; break;
    case 'photos': screen = <PhotosScreen />; tab = 'more'; break;
    case 'programs': screen = <ProgramsScreen />; tab = ''; break;
    case 'program': screen = <ProgramEditor id={id} />; break;
    case 'summary': screen = <Summary id={id} />; break;
    case 'onboarding': screen = <OnboardingScreen />; break;
    default: screen = <TodayScreen />; tab = inSession ? null : '';
  }

  return (
    <div className="app">
      {screen}
      {tab !== null && (
        <nav className="tabbar">
          {TABS.map((x) => (
            <a key={x.path} href={`#/${x.path}`} className={tab === x.path ? 'on' : ''}>
              <Icon name={x.icon} size={22} />
              <span>{t(x.label)}{x.path === '' && inSession ? ' ●' : ''}</span>
            </a>
          ))}
        </nav>
      )}
      <RestBar />
    </div>
  );
}
