import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

/// 웹 `car_factory_web/src/lib/constants.ts` CATEGORY_GROUPS 와 동일.
class CategoryItem {
  const CategoryItem({required this.id, required this.label});

  final String id;
  final String label;
}

class CategoryGroup {
  const CategoryGroup({
    required this.id,
    required this.label,
    required this.shortLabel,
    required this.children,
    required this.icon,
    this.assetFile,
  });

  final String id;
  /// 웹과 동일한 정식 명칭.
  final String label;
  /// 앱 홈/검색 칩용 짧은 표시명 (UI 밀도).
  final String shortLabel;
  final List<CategoryItem> children;
  final IconData icon;

  /// `assets/category_{light|dark}Mode/{assetFile}.png`
  final String? assetFile;

  String? assetPath(Brightness brightness) {
    final file = assetFile;
    if (file == null || file.isEmpty) return null;
    final folder = brightness == Brightness.dark
        ? 'category_darkMode'
        : 'category_lightMode';
    return 'assets/$folder/$file.png';
  }
}

const kCategoryGroups = <CategoryGroup>[
  CategoryGroup(
    id: 'exterior',
    label: '외장 부품',
    shortLabel: '외장',
    icon: CupertinoIcons.car_detailed,
    assetFile: 'Exterior',
    children: [
      CategoryItem(id: 'bumper', label: '범퍼'),
      CategoryItem(id: 'fender', label: '펜더'),
      CategoryItem(id: 'hood', label: '본넷/후드'),
      CategoryItem(id: 'door', label: '도어'),
      CategoryItem(id: 'trunk', label: '트렁크/테일게이트'),
      CategoryItem(id: 'mirror', label: '미러'),
      CategoryItem(id: 'grille', label: '그릴'),
      CategoryItem(id: 'molding', label: '몰딩/가니시'),
      CategoryItem(id: 'exterior-other', label: '기타'),
    ],
  ),
  CategoryGroup(
    id: 'lamp',
    label: '램프/시그널',
    shortLabel: '램프',
    icon: CupertinoIcons.light_max,
    assetFile: 'Lamps',
    children: [
      CategoryItem(id: 'headlight', label: '헤드라이트'),
      CategoryItem(id: 'taillight', label: '테일램프'),
      CategoryItem(id: 'fog-light', label: '안개등'),
      CategoryItem(id: 'turn-signal', label: '방향지시등'),
      CategoryItem(id: 'drl', label: 'DRL'),
      CategoryItem(id: 'lamp-other', label: '기타'),
    ],
  ),
  CategoryGroup(
    id: 'interior',
    label: '내장 부품',
    shortLabel: '내장',
    icon: CupertinoIcons.square_list,
    assetFile: 'Interior',
    children: [
      CategoryItem(id: 'seat', label: '시트'),
      CategoryItem(id: 'dashboard', label: '대시보드'),
      CategoryItem(id: 'steering-wheel', label: '핸들'),
      CategoryItem(id: 'console', label: '콘솔'),
      CategoryItem(id: 'door-trim', label: '도어트림'),
      CategoryItem(id: 'cluster', label: '클러스터/계기판'),
      CategoryItem(id: 'interior-other', label: '기타'),
    ],
  ),
  CategoryGroup(
    id: 'engine',
    label: '엔진/흡기·배기',
    shortLabel: '엔진',
    icon: CupertinoIcons.gear_alt_fill,
    assetFile: 'Engine',
    children: [
      CategoryItem(id: 'engine-assy', label: '엔진앗세이'),
      CategoryItem(id: 'cylinder-head', label: '실린더헤드'),
      CategoryItem(id: 'injector', label: '인젝터'),
      CategoryItem(id: 'turbo', label: '터보'),
      CategoryItem(id: 'intake', label: '흡기매니폴드'),
      CategoryItem(id: 'exhaust', label: '배기/머플러'),
      CategoryItem(id: 'catalyst', label: '촉매'),
      CategoryItem(id: 'engine-other', label: '기타'),
    ],
  ),
  CategoryGroup(
    id: 'drivetrain',
    label: '미션/구동',
    shortLabel: '미션',
    icon: CupertinoIcons.circle_grid_3x3_fill,
    assetFile: 'Transmission',
    children: [
      CategoryItem(id: 'auto-mission', label: '오토미션'),
      CategoryItem(id: 'manual-mission', label: '수동미션'),
      CategoryItem(id: 'transfer', label: '트랜스퍼'),
      CategoryItem(id: 'drive-shaft', label: '드라이브샤프트'),
      CategoryItem(id: 'differential', label: '디퍼렌셜'),
      CategoryItem(id: 'drivetrain-other', label: '기타'),
    ],
  ),
  CategoryGroup(
    id: 'chassis',
    label: '하체/조향·제동',
    shortLabel: '하체',
    icon: CupertinoIcons.arrow_up_arrow_down,
    assetFile: 'Suspension',
    children: [
      CategoryItem(id: 'shock', label: '쇼바/스트럿'),
      CategoryItem(id: 'arm-knuckle', label: '암/너클'),
      CategoryItem(id: 'hub', label: '휠허브'),
      CategoryItem(id: 'steering', label: '스티어링'),
      CategoryItem(id: 'brake', label: '브레이크'),
      CategoryItem(id: 'chassis-other', label: '기타'),
    ],
  ),
  CategoryGroup(
    id: 'cooling',
    label: '냉각/공조',
    shortLabel: '냉각',
    icon: CupertinoIcons.cloud_snow,
    assetFile: 'Cooling_HVAC',
    children: [
      CategoryItem(id: 'radiator', label: '라디에이터'),
      CategoryItem(id: 'condenser', label: '콘덴서'),
      CategoryItem(id: 'intercooler', label: '인터쿨러'),
      CategoryItem(id: 'water-pump', label: '워터펌프'),
      CategoryItem(id: 'ac-compressor', label: '에어컨컴프레서'),
      CategoryItem(id: 'heater-core', label: '히터코어'),
      CategoryItem(id: 'cooling-other', label: '기타'),
    ],
  ),
  CategoryGroup(
    id: 'electrical',
    label: '전장/전자',
    shortLabel: '전장',
    icon: CupertinoIcons.bolt_fill,
    assetFile: 'Electrical',
    children: [
      CategoryItem(id: 'battery', label: '배터리'),
      CategoryItem(id: 'alternator', label: '알터네이터'),
      CategoryItem(id: 'starter', label: '스타트모터'),
      CategoryItem(id: 'ecu', label: 'ECU/모듈'),
      CategoryItem(id: 'sensor', label: '센서'),
      CategoryItem(id: 'wiring', label: '배선/퓨즈박스'),
      CategoryItem(id: 'audio-navi', label: '오디오/내비게이션'),
      CategoryItem(id: 'electrical-other', label: '기타'),
    ],
  ),
  CategoryGroup(
    id: 'wheel',
    label: '휠/타이어',
    shortLabel: '휠',
    icon: CupertinoIcons.circle,
    assetFile: 'Wheels_Tires',
    children: [
      CategoryItem(id: 'alloy-wheel', label: '휠'),
      CategoryItem(id: 'tire', label: '타이어'),
      CategoryItem(id: 'tpms', label: 'TPMS'),
      CategoryItem(id: 'wheel-cap', label: '휠캡'),
      CategoryItem(id: 'wheel-other', label: '기타'),
    ],
  ),
  CategoryGroup(
    id: 'consumable',
    label: '소모품/기타',
    shortLabel: '소모품',
    icon: CupertinoIcons.cube_box,
    assetFile: 'Consumables',
    children: [
      CategoryItem(id: 'filter', label: '필터류'),
      CategoryItem(id: 'oil', label: '오일류'),
      CategoryItem(id: 'belt', label: '벨트/체인'),
      CategoryItem(id: 'consumable-other', label: '기타'),
    ],
  ),
];

CategoryGroup? getCategoryGroup(String groupId) {
  for (final g in kCategoryGroups) {
    if (g.id == groupId) return g;
  }
  return null;
}

CategoryItem? getSubCategory(String subId) {
  for (final g in kCategoryGroups) {
    for (final c in g.children) {
      if (c.id == subId) return c;
    }
  }
  return null;
}

CategoryGroup? getGroupBySubCategory(String subId) {
  for (final g in kCategoryGroups) {
    if (g.children.any((c) => c.id == subId)) return g;
  }
  return null;
}

List<String> getSubCategoryIdsByGroup(String groupId) {
  return getCategoryGroup(groupId)?.children.map((c) => c.id).toList() ??
      const [];
}

String? categoryGroupLabel(String idOrLabel) {
  final byId = getCategoryGroup(idOrLabel);
  if (byId != null) return byId.label;
  for (final g in kCategoryGroups) {
    if (g.label == idOrLabel || g.shortLabel == idOrLabel) return g.label;
  }
  final sub = getSubCategory(idOrLabel);
  if (sub != null) return getGroupBySubCategory(idOrLabel)?.label;
  return null;
}
