import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Scanner: undefined;
  Maps: { focusId?: string } | undefined;
  Reports: undefined;
  More: NavigatorScreenParams<MoreStackParamList> | undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  AdminMain: NavigatorScreenParams<AdminTabParamList> | undefined;
  ReportDetail: { id: string };
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Profile: undefined;
  Farm: undefined;
  Orders: undefined;
  Settings: undefined;
};

// Área do administrador: outro conjunto de abas, só para quem tem o papel "admin".
export type AdminTabParamList = {
  AdminHome: undefined;
  AdminUsers: undefined;
  AdminPests: undefined;
  AdminMore: NavigatorScreenParams<AdminMoreStackParamList> | undefined;
};

export type AdminMoreStackParamList = {
  AdminMenu: undefined;
  AdminOrders: undefined;
  AdminActivity: undefined;
  Profile: undefined;
  Settings: undefined;
};
