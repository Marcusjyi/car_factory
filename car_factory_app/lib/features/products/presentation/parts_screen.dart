import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/models/product.dart';
import '../../../shared/widgets/cf_header.dart';
import '../../../shared/widgets/product_card.dart';
import '../product_repository.dart';

final _partsQueryProvider = StateProvider.autoDispose<String>((ref) => '');
final _partsCategoryProvider = StateProvider.autoDispose<String?>((ref) => null);

final _partsListProvider =
    FutureProvider.autoDispose<List<ProductPublicDto>>((ref) {
  final q = ref.watch(_partsQueryProvider);
  final category = ref.watch(_partsCategoryProvider);
  return ProductRepository().listProducts(
    ProductSearchFilter(
      q: q.isEmpty ? null : q,
      category: category,
      limit: 60,
    ),
  );
});

class PartsScreen extends ConsumerStatefulWidget {
  const PartsScreen({super.key, this.initialCategory});

  final String? initialCategory;

  @override
  ConsumerState<PartsScreen> createState() => _PartsScreenState();
}

class _PartsScreenState extends ConsumerState<PartsScreen> {
  late final TextEditingController _searchController;

  static const _filterOptions = <String, List<String>>{
    '정렬': ['최신 등록순', '낮은 가격순', '높은 가격순', '인기순'],
    '브랜드': ['전체', '현대', '기아', 'BMW', '벤츠', '아우디', '토요타', '기타'],
    '상태': ['전체', '신품', '중고A', '중고B', '중고C'],
    '가격': ['전체', '~10만', '10~30만', '30~50만', '50만~'],
    '지역': ['전체', '서울', '경기', '인천', '부산', '대구', '기타'],
    '배송': ['전체', '택배', '직거래', '둘 다'],
  };

  final Map<String, String> _selectedFilters = {
    '정렬': '최신 등록순',
    '브랜드': '전체',
    '상태': '전체',
    '가격': '전체',
    '지역': '전체',
    '배송': '전체',
  };

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    if (widget.initialCategory != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(_partsCategoryProvider.notifier).state =
            widget.initialCategory;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openFilterSheet() async {
    final cf = context.cf;
    final draft = Map<String, String>.from(_selectedFilters);
    var draftCategory = ref.read(_partsCategoryProvider);

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: cf.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            Widget chip({
              required String label,
              required bool selected,
              required VoidCallback onTap,
            }) {
              return GestureDetector(
                onTap: onTap,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: cf.surfaceVariant,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: selected ? AppColors.accentBlue : cf.divider,
                    ),
                  ),
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: selected
                          ? AppColors.accentBlue
                          : cf.textPrimary,
                    ),
                  ),
                ),
              );
            }

            return SafeArea(
              child: Padding(
                padding: EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 12,
                  bottom: 16 + MediaQuery.viewInsetsOf(ctx).bottom,
                ),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.sizeOf(ctx).height * 0.85,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 36,
                          height: 4,
                          decoration: BoxDecoration(
                            color: cf.divider,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Text(
                            '필터',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: cf.textPrimary,
                            ),
                          ),
                          const Spacer(),
                          TextButton(
                            onPressed: () {
                              setModalState(() {
                                for (final key in draft.keys) {
                                  draft[key] = key == '정렬' ? '최신 등록순' : '전체';
                                }
                                draftCategory = null;
                              });
                            },
                            child: Text(
                              '초기화',
                              style: TextStyle(color: cf.textSecondary),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Flexible(
                        child: SingleChildScrollView(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '카테고리',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: cf.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  chip(
                                    label: '전체',
                                    selected: draftCategory == null,
                                    onTap: () {
                                      setModalState(() => draftCategory = null);
                                    },
                                  ),
                                  ...kSearchCategories.map(
                                    (c) => chip(
                                      label: c.displayLabel,
                                      selected: draftCategory == c.id,
                                      onTap: () {
                                        setModalState(
                                          () => draftCategory = c.id,
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              ..._filterOptions.entries.map((entry) {
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 16),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        entry.key,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: cf.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        children: entry.value.map((option) {
                                          final selected =
                                              draft[entry.key] == option;
                                          return chip(
                                            label: option,
                                            selected: selected,
                                            onTap: () {
                                              setModalState(() {
                                                draft[entry.key] = option;
                                              });
                                            },
                                          );
                                        }).toList(),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: () {
                            setState(() {
                              _selectedFilters
                                ..clear()
                                ..addAll(draft);
                            });
                            ref.read(_partsCategoryProvider.notifier).state =
                                draftCategory;
                            Navigator.pop(ctx);
                          },
                          child: const Text('적용'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final list = ref.watch(_partsListProvider);
    final cf = context.cf;

    return Scaffold(
      backgroundColor: cf.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CfHeader(
              showBell: false,
              trailing: TextButton.icon(
                onPressed: _openFilterSheet,
                icon: Icon(
                  CupertinoIcons.line_horizontal_3_decrease,
                  size: 18,
                  color: cf.textPrimary,
                ),
                label: Text(
                  '필터',
                  style: TextStyle(color: cf.textPrimary, fontSize: 14),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
              child: CfSearchBar(
                controller: _searchController,
                onSubmitted: (v) {
                  ref.read(_partsQueryProvider.notifier).state = v.trim();
                },
                onChanged: (v) {
                  if (v.isEmpty) {
                    ref.read(_partsQueryProvider.notifier).state = '';
                  }
                },
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: list.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('$e')),
                data: (items) {
                  if (items.isEmpty) {
                    return Center(
                      child: Text(
                        '검색 결과가 없습니다.',
                        style: TextStyle(color: cf.textSecondary),
                      ),
                    );
                  }
                  return GridView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.72,
                    ),
                    itemCount: items.length,
                    itemBuilder: (context, i) {
                      final p = items[i];
                      return ProductCard(
                        product: p,
                        onTap: () => context.push('/parts/${p.id}'),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
