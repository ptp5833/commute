let _sdk = null;
let _inTeams = false;

export const initTeams = async () => {
  try {
    const sdk = await import('@microsoft/teams-js');
    await sdk.app.initialize();
    _sdk = sdk;
    _inTeams = true;
    return true;
  } catch {
    _inTeams = false;
    return false;
  }
};

export const isInTeams = () => _inTeams;

export const getTeamsUser = async () => {
  if (!_sdk) return null;
  try {
    const context = await _sdk.app.getContext();
    return {
      name: context.user?.displayName ?? '',
      email: context.user?.userPrincipalName ?? '',
    };
  } catch {
    return null;
  }
};
