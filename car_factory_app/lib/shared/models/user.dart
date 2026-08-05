enum AuthProviderId { kakao, naver, google, apple }

enum UserRole { user, admin, superAdmin }

enum UserStatus { active, suspended, withdrawn }

class UserTransferAccount {
  const UserTransferAccount({
    required this.bankName,
    required this.accountNumber,
    required this.accountHolder,
  });

  final String bankName;
  final String accountNumber;
  final String accountHolder;

  factory UserTransferAccount.fromMap(Map<String, dynamic>? map) {
    if (map == null) {
      return const UserTransferAccount(
        bankName: '',
        accountNumber: '',
        accountHolder: '',
      );
    }
    return UserTransferAccount(
      bankName: map['bankName'] as String? ?? '',
      accountNumber: map['accountNumber'] as String? ?? '',
      accountHolder: map['accountHolder'] as String? ?? '',
    );
  }
}

class UserDocument {
  const UserDocument({
    required this.uid,
    required this.name,
    required this.displayName,
    required this.photoURL,
    required this.email,
    required this.phoneNumber,
    required this.providers,
    required this.defaultRegion,
    required this.role,
    required this.status,
    required this.profileCompleted,
    this.defaultTransferAccount,
  });

  final String uid;
  final String name;
  final String displayName;
  final String? photoURL;
  final String? email;
  final String? phoneNumber;
  final List<AuthProviderId> providers;
  final String? defaultRegion;
  final UserRole role;
  final UserStatus status;
  final bool profileCompleted;
  final UserTransferAccount? defaultTransferAccount;

  bool get isProfileComplete =>
      profileCompleted &&
      displayName.trim().isNotEmpty &&
      (phoneNumber?.trim().isNotEmpty ?? false);

  factory UserDocument.fromMap(String uid, Map<String, dynamic> map) {
    final providersRaw = (map['providers'] as List<dynamic>? ?? const [])
        .map((e) => e.toString())
        .toList();
    return UserDocument(
      uid: uid,
      name: map['name'] as String? ?? '',
      displayName: map['displayName'] as String? ?? '',
      photoURL: map['photoURL'] as String?,
      email: map['email'] as String?,
      phoneNumber: map['phoneNumber'] as String?,
      providers: providersRaw.map(_parseProvider).toList(),
      defaultRegion: map['defaultRegion'] as String?,
      role: _parseRole(map['role'] as String?),
      status: _parseStatus(map['status'] as String?),
      profileCompleted: map['profileCompleted'] as bool? ?? false,
      defaultTransferAccount: map['defaultTransferAccount'] != null
          ? UserTransferAccount.fromMap(
              Map<String, dynamic>.from(map['defaultTransferAccount'] as Map),
            )
          : null,
    );
  }

  static AuthProviderId _parseProvider(String value) {
    switch (value) {
      case 'kakao':
        return AuthProviderId.kakao;
      case 'naver':
        return AuthProviderId.naver;
      case 'apple':
        return AuthProviderId.apple;
      default:
        return AuthProviderId.google;
    }
  }

  static UserRole _parseRole(String? value) {
    switch (value) {
      case 'admin':
        return UserRole.admin;
      case 'super_admin':
      case 'superAdmin':
        return UserRole.superAdmin;
      default:
        return UserRole.user;
    }
  }

  static UserStatus _parseStatus(String? value) {
    switch (value) {
      case 'suspended':
        return UserStatus.suspended;
      case 'withdrawn':
        return UserStatus.withdrawn;
      default:
        return UserStatus.active;
    }
  }
}
