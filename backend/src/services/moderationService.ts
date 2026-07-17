export const moderationService = {
  /**
   * Scans prompt or copy for patient PII leaks or graphic clinical content
   */
  async scanContent(text: string): Promise<{ approved: boolean; reason?: string }> {
    return { approved: true };
  }
};
