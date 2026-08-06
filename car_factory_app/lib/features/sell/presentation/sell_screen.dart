import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/firebase/firebase_bootstrap.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/categories.dart';
import '../../../shared/widgets/cf_header.dart';
import '../../auth/auth_controller.dart';

enum _DealMethod { delivery, direct, transfer }

enum _ShippingPayer { seller, buyer }

enum _ConditionGrade { neu, usedA, usedB, usedC }

class SellScreen extends ConsumerStatefulWidget {
  const SellScreen({super.key});

  @override
  ConsumerState<SellScreen> createState() => _SellScreenState();
}

class _SellScreenState extends ConsumerState<SellScreen> {
  final _partNameCtrl = TextEditingController();
  final _partNumberCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _picker = ImagePicker();

  final List<XFile> _photos = [];
  String? _categoryId;
  String? _categoryLabel;
  String? _vehicleInfo;
  String? _region;
  _ConditionGrade _condition = _ConditionGrade.neu;
  _DealMethod _deal = _DealMethod.delivery;
  _ShippingPayer _shipping = _ShippingPayer.seller;
  bool _submitting = false;

  static const _regions = [
    '서울',
    '경기 수원시',
    '경기 안산시',
    '인천',
    '부산',
    '대구',
    '기타',
  ];

  @override
  void dispose() {
    _partNameCtrl.dispose();
    _partNumberCtrl.dispose();
    _priceCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickPhotos() async {
    if (_photos.length >= 10) return;
    final picked = await _picker.pickMultiImage(imageQuality: 85);
    if (picked.isEmpty) return;
    setState(() {
      _photos.addAll(picked.take(10 - _photos.length));
    });
  }

  Future<void> _selectCategory() async {
    final result = await showCupertinoModalPopup<CategoryGroup>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: const Text('부품 카테고리'),
        actions: kCategoryGroups
            .map(
              (g) => CupertinoActionSheetAction(
                onPressed: () => Navigator.pop(ctx, g),
                child: Text(g.label),
              ),
            )
            .toList(),
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('취소'),
        ),
      ),
    );
    if (result != null) {
      setState(() {
        _categoryId = result.id;
        _categoryLabel = result.label;
      });
    }
  }

  Future<void> _selectVehicle() async {
    final brands = ['현대', '기아', 'BMW', '벤츠', '아우디', '토요타', '기타'];
    final brand = await showCupertinoModalPopup<String>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: const Text('브랜드 선택'),
        actions: brands
            .map(
              (b) => CupertinoActionSheetAction(
                onPressed: () => Navigator.pop(ctx, b),
                child: Text(b),
              ),
            )
            .toList(),
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('취소'),
        ),
      ),
    );
    if (brand == null || !mounted) return;
    setState(() => _vehicleInfo = '$brand · 모델 · 연식');
  }

  Future<void> _selectRegion() async {
    final result = await showCupertinoModalPopup<String>(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: const Text('거래 지역'),
        actions: _regions
            .map(
              (r) => CupertinoActionSheetAction(
                onPressed: () => Navigator.pop(ctx, r),
                child: Text(r),
              ),
            )
            .toList(),
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('취소'),
        ),
      ),
    );
    if (result != null) setState(() => _region = result);
  }

  Future<void> _submit() async {
    final auth = ref.read(authControllerProvider);
    if (auth.firebaseUser == null) {
      context.push('/login?next=/sell');
      return;
    }
    final partName = _partNameCtrl.text.trim();
    final price = int.tryParse(_priceCtrl.text.replaceAll(',', '').trim());
    if (partName.isEmpty) {
      _toast('부품명을 입력하세요');
      return;
    }
    if (price == null || price <= 0) {
      _toast('가격을 입력하세요');
      return;
    }
    if (_categoryId == null) {
      _toast('카테고리를 선택하세요');
      return;
    }

    setState(() => _submitting = true);
    try {
      final uid = auth.firebaseUser!.uid;
      final displayName = auth.profile?.displayName ?? '판매자';
      final doc = FirebaseBootstrap.db.collection('products').doc();
      final imageMaps = <Map<String, dynamic>>[];

      for (var i = 0; i < _photos.length; i++) {
        final file = File(_photos[i].path);
        final path = 'products/${doc.id}/$i.jpg';
        final ref = FirebaseStorage.instance.ref(path);
        await ref.putFile(file);
        final url = await ref.getDownloadURL();
        imageMaps.add({
          'path': path,
          'downloadURL': url,
          'width': 0,
          'height': 0,
          'sortOrder': i,
        });
      }

      final conditionValue = switch (_condition) {
        _ConditionGrade.neu => 'new',
        _ => 'used',
      };

      await doc.set({
        'title': partName,
        'partName': partName,
        'partNumber': _partNumberCtrl.text.trim(),
        'price': price,
        'condition': conditionValue,
        'category': _categoryId,
        'categoryId': _categoryId,
        'partCategory': _categoryLabel,
        'manufacturer': _vehicleInfo?.split(' · ').first ?? '',
        'vehicleModelName': _vehicleInfo ?? '',
        'region': _region,
        'description': _descCtrl.text.trim(),
        'images': imageMaps,
        'thumbnailURL': imageMaps.isNotEmpty ? imageMaps.first['downloadURL'] : '',
        'sellerUid': uid,
        'sellerDisplayName': displayName,
        'status': 'selling',
        'dealMethod': _deal.name,
        'shippingPayer': _shipping.name,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      if (!mounted) return;
      _toast('등록되었습니다');
      context.go('/parts/${doc.id}');
    } catch (e) {
      _toast('등록 실패: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;

    return Scaffold(
      backgroundColor: cf.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/');
                      }
                    },
                    icon: Icon(
                      CupertinoIcons.back,
                      color: cf.textPrimary,
                    ),
                  ),
                  Expanded(
                    child: CfPageTitle(
                      '부품 판매 등록',
                      center: true,
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                children: [
                  _PhotoSection(
                    photos: _photos,
                    onAdd: _pickPhotos,
                    onRemove: (i) => setState(() => _photos.removeAt(i)),
                  ),
                  const SizedBox(height: 16),
                  _FormCard(
                    children: [
                      _NavRow(
                        label: '부품 카테고리',
                        value: _categoryLabel,
                        placeholder: '카테고리를 선택하세요',
                        onTap: _selectCategory,
                      ),
                      _Divider(),
                      _NavRow(
                        label: '차량 정보',
                        value: _vehicleInfo,
                        placeholder: '브랜드 · 모델 · 연식 선택',
                        onTap: _selectVehicle,
                      ),
                      _Divider(),
                      _InputRow(
                        label: '부품명',
                        controller: _partNameCtrl,
                        hint: '예) 브레이크 디스크',
                      ),
                      _Divider(),
                      _InputRow(
                        label: '부품 번호 (선택)',
                        controller: _partNumberCtrl,
                        hint: '예) 3411 6872 123',
                      ),
                      _Divider(),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '상태',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: cf.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                _ConditionChip(
                                  label: '새제품',
                                  selected: _condition == _ConditionGrade.neu,
                                  onTap: () => setState(
                                    () => _condition = _ConditionGrade.neu,
                                  ),
                                ),
                                _ConditionChip(
                                  label: '중고 (A급)',
                                  selected: _condition == _ConditionGrade.usedA,
                                  onTap: () => setState(
                                    () => _condition = _ConditionGrade.usedA,
                                  ),
                                ),
                                _ConditionChip(
                                  label: '중고 (B급)',
                                  selected: _condition == _ConditionGrade.usedB,
                                  onTap: () => setState(
                                    () => _condition = _ConditionGrade.usedB,
                                  ),
                                ),
                                _ConditionChip(
                                  label: '중고 (C급)',
                                  selected: _condition == _ConditionGrade.usedC,
                                  onTap: () => setState(
                                    () => _condition = _ConditionGrade.usedC,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      _Divider(),
                      _InputRow(
                        label: '가격',
                        controller: _priceCtrl,
                        hint: '가격을 입력하세요',
                        prefix: '₩ ',
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _FormCard(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  '거래 방식',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: cf.textPrimary,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(
                                  CupertinoIcons.info_circle,
                                  size: 16,
                                  color: cf.textSecondary,
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: _DealChip(
                                    icon: CupertinoIcons.cube_box,
                                    label: '택배',
                                    selected: _deal == _DealMethod.delivery,
                                    onTap: () => setState(
                                      () => _deal = _DealMethod.delivery,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _DealChip(
                                    icon: CupertinoIcons.person_2,
                                    label: '직거래',
                                    selected: _deal == _DealMethod.direct,
                                    onTap: () => setState(
                                      () => _deal = _DealMethod.direct,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _DealChip(
                                    icon: CupertinoIcons.creditcard,
                                    label: '계좌이체',
                                    selected: _deal == _DealMethod.transfer,
                                    onTap: () => setState(
                                      () => _deal = _DealMethod.transfer,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      _Divider(),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Row(
                          children: [
                            Text(
                              '배송비',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: cf.textPrimary,
                              ),
                            ),
                            const Spacer(),
                            _RadioLabel(
                              label: '판매자 부담',
                              selected: _shipping == _ShippingPayer.seller,
                              onTap: () => setState(
                                () => _shipping = _ShippingPayer.seller,
                              ),
                            ),
                            const SizedBox(width: 12),
                            _RadioLabel(
                              label: '구매자 부담',
                              selected: _shipping == _ShippingPayer.buyer,
                              onTap: () => setState(
                                () => _shipping = _ShippingPayer.buyer,
                              ),
                            ),
                          ],
                        ),
                      ),
                      _Divider(),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '설명',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: cf.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _descCtrl,
                              maxLines: 4,
                              maxLength: 500,
                              style: TextStyle(color: cf.textPrimary),
                              decoration: InputDecoration(
                                hintText: '부품에 대한 상세 설명을 입력하세요 (선택)',
                                filled: true,
                                fillColor: cf.surfaceVariant,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                              onChanged: (_) => setState(() {}),
                            ),
                          ],
                        ),
                      ),
                      _Divider(),
                      _NavRow(
                        label: '거래 지역',
                        value: _region,
                        placeholder: '지역을 선택하세요',
                        onTap: _selectRegion,
                        leading: Icon(
                          CupertinoIcons.location_solid,
                          size: 18,
                          color: cf.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 52,
                    child: FilledButton(
                      onPressed: _submitting ? null : _submit,
                      child: _submitting
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              '등록하기',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PhotoSection extends StatelessWidget {
  const _PhotoSection({
    required this.photos,
    required this.onAdd,
    required this.onRemove,
  });

  final List<XFile> photos;
  final VoidCallback onAdd;
  final ValueChanged<int> onRemove;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              '부품 사진',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: cf.textPrimary,
              ),
            ),
            const SizedBox(width: 4),
            Icon(CupertinoIcons.info_circle, size: 16, color: cf.textSecondary),
            const SizedBox(width: 4),
            Text(
              '최대 10장까지 등록 가능',
              style: TextStyle(fontSize: 12, color: cf.textSecondary),
            ),
            const Spacer(),
            Text(
              '${photos.length}/10',
              style: TextStyle(fontSize: 13, color: cf.textSecondary),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 80,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              GestureDetector(
                onTap: onAdd,
                child: CustomPaint(
                  painter: _DashedBorderPainter(color: cf.divider),
                  child: SizedBox(
                    width: 80,
                    height: 80,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          CupertinoIcons.camera,
                          color: cf.textSecondary,
                          size: 22,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '사진 추가',
                          style: TextStyle(
                            fontSize: 11,
                            color: cf.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              ...List.generate(photos.length, (i) {
                return Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(photos[i].path),
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        right: 2,
                        top: 2,
                        child: GestureDetector(
                          onTap: () => onRemove(i),
                          child: Container(
                            decoration: const BoxDecoration(
                              color: Colors.black54,
                              shape: BoxShape.circle,
                            ),
                            padding: const EdgeInsets.all(2),
                            child: const Icon(
                              CupertinoIcons.xmark,
                              size: 12,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
              ...List.generate(
                (4 - photos.length).clamp(0, 4),
                (_) => Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: cf.surfaceVariant,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: cf.divider),
                    ),
                    child: Icon(
                      CupertinoIcons.photo,
                      color: cf.textSecondary,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  _DashedBorderPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    const dash = 4.0;
    const gap = 3.0;
    final r = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      const Radius.circular(8),
    );
    final path = Path()..addRRect(r);
    for (final metric in path.computeMetrics()) {
      var dist = 0.0;
      while (dist < metric.length) {
        final next = dist + dash;
        canvas.drawPath(
          metric.extractPath(dist, next.clamp(0, metric.length)),
          paint,
        );
        dist = next + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedBorderPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _FormCard extends StatelessWidget {
  const _FormCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: cf.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cf.divider),
      ),
      child: Column(children: children),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Divider(height: 1, color: context.cf.divider);
  }
}

class _NavRow extends StatelessWidget {
  const _NavRow({
    required this.label,
    required this.placeholder,
    required this.onTap,
    this.value,
    this.leading,
  });

  final String label;
  final String placeholder;
  final String? value;
  final VoidCallback onTap;
  final Widget? leading;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        height: 52,
        child: Row(
          children: [
            if (leading != null) ...[leading!, const SizedBox(width: 6)],
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: cf.textPrimary,
              ),
            ),
            const Spacer(),
            Flexible(
              child: Text(
                value ?? placeholder,
                textAlign: TextAlign.right,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: value == null ? cf.textSecondary : cf.textPrimary,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 4),
            Icon(CupertinoIcons.chevron_right, size: 16, color: cf.textSecondary),
          ],
        ),
      ),
    );
  }
}

class _InputRow extends StatelessWidget {
  const _InputRow({
    required this.label,
    required this.controller,
    required this.hint,
    this.prefix,
    this.keyboardType,
    this.inputFormatters,
  });

  final String label;
  final TextEditingController controller;
  final String hint;
  final String? prefix;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return SizedBox(
      height: 52,
      child: Row(
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: cf.textPrimary,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: keyboardType,
              inputFormatters: inputFormatters,
              textAlign: TextAlign.right,
              style: TextStyle(color: cf.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                isDense: true,
                hintText: hint,
                prefixText: prefix,
                prefixStyle: TextStyle(color: cf.textPrimary),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ConditionChip extends StatelessWidget {
  const _ConditionChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.accentBlue : cf.surfaceVariant,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppColors.accentBlue : cf.divider,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : cf.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _DealChip extends StatelessWidget {
  const _DealChip({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 40,
        decoration: BoxDecoration(
          color: cf.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.accentBlue : cf.divider,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: selected ? AppColors.accentBlue : cf.textSecondary,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: selected ? AppColors.accentBlue : cf.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RadioLabel extends StatelessWidget {
  const _RadioLabel({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Icon(
            selected
                ? CupertinoIcons.checkmark_circle_fill
                : CupertinoIcons.circle,
            size: 18,
            color: selected ? AppColors.accentBlue : cf.textSecondary,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 13, color: cf.textPrimary),
          ),
        ],
      ),
    );
  }
}
