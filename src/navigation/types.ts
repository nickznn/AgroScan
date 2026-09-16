import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Scanner: undefined;
  Maps: undefined;
  Reports: undefined;
  More: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  ReportDetail: { id: string };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Profile: undefined;
  Farm: undefined;
  Orders: undefined;
  Settings: undefined;
};
