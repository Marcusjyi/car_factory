/// 앱 전역 설정.
///
/// Firebase Web/Android/iOS 앱 등록 후 `flutterfire configure`로
/// [DefaultFirebaseOptions]를 갱신하는 것을 권장한다.
abstract final class AppConfig {
  static const appName = '카팩토리';
  static const packageId = 'com.carfactory.car_factory_app';

  /// 웹(App Hosting)과 동일 Firebase 프로젝트
  static const firebaseProjectId = 'car-factory-40a14';

  /// 콘솔 `(default)`(nam5)가 아닌 서울 named DB
  static const firestoreDatabaseId = 'default';

  static const functionsRegion = 'asia-northeast3';

  /// 카카오/네이버 Custom Token 콜백 베이스
  /// 예: https://asia-northeast3-car-factory-40a14.cloudfunctions.net
  static const functionsBaseUrl = String.fromEnvironment(
    'FUNCTIONS_BASE_URL',
    defaultValue: '',
  );

  static const kakaoRestApiKey = String.fromEnvironment(
    'KAKAO_REST_API_KEY',
    defaultValue: '',
  );

  static const naverClientId = String.fromEnvironment(
    'NAVER_CLIENT_ID',
    defaultValue: '',
  );
}
