import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/models/product.dart';
import '../../shell/presentation/main_shell.dart';
import '../product_repository.dart';

final _partsQueryProvider = StateProvider<String>((ref) => '');

final _partsListProvider = FutureProvider<List<ProductPublicDto>>((ref) {
  final q = ref.watch(_partsQueryProvider);
  return ProductRepository().listProducts(
    ProductSearchFilter(q: q.isEmpty ? null : q, limit: 40),
  );
});

class PartsScreen extends ConsumerWidget {
  const PartsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(_partsListProvider);
    final currency = NumberFormat('#,###');

    return Scaffold(
      appBar: cfAppBar(context, title: '부품 검색'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              decoration: const InputDecoration(
                hintText: '차종, 부품명, 제조사 검색',
                prefixIcon: Icon(Icons.search),
              ),
              textInputAction: TextInputAction.search,
              onSubmitted: (v) {
                ref.read(_partsQueryProvider.notifier).state = v.trim();
              },
            ),
          ),
          Expanded(
            child: list.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('$e')),
              data: (items) {
                if (items.isEmpty) {
                  return const Center(
                    child: Text(
                      '검색 결과가 없습니다.',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final p = items[i];
                    return ListTile(
                      onTap: () => context.push('/parts/${p.id}'),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: AppColors.border),
                      ),
                      tileColor: AppColors.surface,
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: SizedBox(
                          width: 56,
                          height: 56,
                          child: p.thumbnailURL.isEmpty
                              ? const ColoredBox(
                                  color: AppColors.bg,
                                  child: Icon(Icons.image_outlined),
                                )
                              : Image.network(
                                  p.thumbnailURL,
                                  fit: BoxFit.cover,
                                ),
                        ),
                      ),
                      title: Text(
                        p.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        '${p.manufacturer} · ${p.vehicleModelName}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: Text(
                        '${currency.format(p.price)}원',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
