import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/partners/partner_reservations_repository.dart';
import '../../../core/partners/partners_repository.dart';
import '../../../core/theme/app_theme.dart';

final _partnerByIdProvider =
    FutureProvider.family<PartnerShop?, String>((ref, id) {
  return PartnersRepository.fetchById(id);
});

/// 웹 `/installers/[id]/reserve` 와 동일 필드 UI (미리보기 — 저장 없음)
class PartnerReserveScreen extends ConsumerStatefulWidget {
  const PartnerReserveScreen({super.key, required this.partnerId});

  final String partnerId;

  @override
  ConsumerState<PartnerReserveScreen> createState() =>
      _PartnerReserveScreenState();
}

class _PartnerReserveScreenState extends ConsumerState<PartnerReserveScreen> {
  static const _timeOptions = [
    '10:00',
    '11:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
  ];

  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _partCtrl = TextEditingController();
  final _memoCtrl = TextEditingController();

  DateTime? _date;
  String? _time;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _partCtrl.dispose();
    _memoCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  bool _submitting = false;

  Future<void> _submit(PartnerShop shop) async {
    if (_submitting) return;
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_date == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('희망 날짜를 선택해 주세요.')),
      );
      return;
    }
    if (_time == null || _time!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('희망 시간을 선택해 주세요.')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await PartnerReservationsRepository.create(
        PartnerReservationInput(
          shop: shop,
          customerName: _nameCtrl.text,
          customerPhone: _phoneCtrl.text,
          preferredDate: DateFormat('yyyy-MM-dd').format(_date!),
          preferredTime: _time!,
          partOrOrder: _partCtrl.text,
          memo: _memoCtrl.text,
        ),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${shop.name} 예약 신청이 접수되었습니다.')),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('ArgumentError: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cf = context.cf;
    final async = ref.watch(_partnerByIdProvider(widget.partnerId));

    return Scaffold(
      backgroundColor: cf.background,
      appBar: AppBar(
        backgroundColor: cf.surface,
        foregroundColor: cf.textPrimary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(CupertinoIcons.back),
          onPressed: () => context.pop(),
        ),
        title: Text(
          '장착 예약',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: cf.textPrimary,
          ),
        ),
      ),
      body: async.when(
        loading: () => const Center(child: CupertinoActivityIndicator()),
        error: (e, _) => Center(child: Text('불러오지 못했습니다\n$e')),
        data: (shop) {
          if (shop == null) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '장착점을 찾을 수 없습니다',
                    style: TextStyle(color: cf.textSecondary),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => context.pop(),
                    child: const Text('뒤로'),
                  ),
                ],
              ),
            );
          }
          return _buildBody(shop, cf);
        },
      ),
    );
  }

  Widget _buildBody(PartnerShop shop, CfColors cf) {
    final dateLabel = _date == null
        ? '날짜 선택'
        : DateFormat('yyyy-MM-dd').format(_date!);

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: shop.photoURL.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: shop.photoURL,
                      fit: BoxFit.cover,
                      errorWidget: (_, _, _) => ColoredBox(
                        color: cf.surfaceVariant,
                        child: Icon(
                          CupertinoIcons.building_2_fill,
                          color: cf.textSecondary,
                          size: 40,
                        ),
                      ),
                    )
                  : ColoredBox(
                      color: cf.surfaceVariant,
                      child: Icon(
                        CupertinoIcons.building_2_fill,
                        color: cf.textSecondary,
                        size: 40,
                      ),
                    ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: cf.surface,
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(16),
              ),
              border: Border.all(color: cf.divider),
            ),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        '${shop.name} 예약',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: cf.textPrimary,
                        ),
                      ),
                    ),
                    if (shop.region.isNotEmpty)
                      Text(
                        shop.region,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.accentBlue,
                        ),
                      ),
                  ],
                ),
                if (shop.description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    shop.description,
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.45,
                      color: cf.textSecondary,
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                if (shop.address.isNotEmpty)
                  _InfoRow(
                    icon: CupertinoIcons.location_solid,
                    child: Text(
                      shop.address,
                      style: TextStyle(fontSize: 14, color: cf.textSecondary),
                    ),
                  ),
                if (shop.phone.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: CupertinoIcons.phone_fill,
                    child: GestureDetector(
                      onTap: () {
                        final tel = shop.phone.replaceAll(RegExp(r'\D'), '');
                        launchUrl(Uri(scheme: 'tel', path: tel));
                      },
                      child: Text(
                        shop.phone,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.accentBlue,
                        ),
                      ),
                    ),
                  ),
                ],
                if (shop.hours.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: CupertinoIcons.clock_fill,
                    child: Text(
                      shop.hours,
                      style: TextStyle(fontSize: 14, color: cf.textSecondary),
                    ),
                  ),
                ],
                if (shop.specialties.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: CupertinoIcons.wrench_fill,
                    child: Text(
                      shop.specialties.join(' · '),
                      style: TextStyle(fontSize: 14, color: cf.textSecondary),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                Divider(height: 1, color: cf.divider),
                const SizedBox(height: 16),
                Text(
                  '예약 정보',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: cf.textPrimary,
                  ),
                ),
                const SizedBox(height: 14),
                _Label('이름'),
                TextFormField(
                  controller: _nameCtrl,
                  textInputAction: TextInputAction.next,
                  decoration: _inputDeco(cf, '예약자 이름'),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? '이름을 입력해 주세요' : null,
                ),
                const SizedBox(height: 14),
                _Label('연락처'),
                TextFormField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  decoration: _inputDeco(cf, '010-0000-0000'),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? '연락처를 입력해 주세요' : null,
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _Label('희망 날짜'),
                          InkWell(
                            onTap: _pickDate,
                            borderRadius: BorderRadius.circular(8),
                            child: InputDecorator(
                              decoration: _inputDeco(cf, ''),
                              child: Text(
                                dateLabel,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: _date == null
                                      ? cf.textSecondary
                                      : cf.textPrimary,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _Label('희망 시간'),
                          DropdownButtonFormField<String>(
                            // ignore: deprecated_member_use
                            value: _time,
                            decoration: _inputDeco(cf, '시간 선택'),
                            items: [
                              for (final t in _timeOptions)
                                DropdownMenuItem(value: t, child: Text(t)),
                            ],
                            onChanged: (v) => setState(() => _time = v),
                            validator: (v) =>
                                (v == null || v.isEmpty) ? '시간 선택' : null,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _Label('장착 부품 / 주문번호'),
                TextFormField(
                  controller: _partCtrl,
                  decoration: _inputDeco(cf, '예: 헤드램프 / CF-2026-0012'),
                ),
                const SizedBox(height: 14),
                _Label('요청 사항'),
                TextFormField(
                  controller: _memoCtrl,
                  minLines: 4,
                  maxLines: 6,
                  decoration: _inputDeco(cf, '차량 정보, 특이사항 등을 적어 주세요'),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  height: 48,
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _submitting ? null : () => _submit(shop),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.accentBlue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      _submitting ? '신청 중…' : '예약 신청하기',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  '* 신청 내용은 카팩토리에 저장되며, 매장 확인 후 연락드릴 수 있습니다.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: cf.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDeco(CfColors cf, String hint) {
    return InputDecoration(
      hintText: hint.isEmpty ? null : hint,
      hintStyle: TextStyle(fontSize: 14, color: cf.textSecondary),
      filled: true,
      fillColor: cf.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: cf.divider),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: cf.divider),
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(8)),
        borderSide: BorderSide(color: AppColors.accentBlue),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: context.cf.textPrimary,
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.child});
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.accentBlue),
        const SizedBox(width: 8),
        Expanded(child: child),
      ],
    );
  }
}
