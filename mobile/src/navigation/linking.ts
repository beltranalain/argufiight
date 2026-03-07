import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
  prefixes: ['argufight://', 'https://www.argufight.com'],
  config: {
    screens: {
      App: {
        screens: {
          HomeTab: {
            screens: {
              Dashboard: 'dashboard',
              DebateRoom: 'debate/:id',
            },
          },
          ArenaTab: {
            screens: {
              Trending: 'trending',
            },
          },
          RankingsTab: {
            screens: {
              Leaderboard: 'leaderboard',
            },
          },
          TourneysTab: {
            screens: {
              Tournaments: 'tournaments',
              TournamentDetail: 'tournaments/:id',
            },
          },
          HistoryTab: {
            screens: {
              DebateHistory: 'debates/history',
            },
          },
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          Signup: 'signup',
        },
      },
      UserProfile: 'profile/:id',
      Messages: 'messages',
      Settings: 'settings',
    },
  },
};
