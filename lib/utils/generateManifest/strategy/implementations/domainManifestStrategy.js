import ManifestStrategy from '../manifestStrategy.js';

/**
 * DomainManisfestStrategy
 * @class DomainManisfestStrategy
 * @description This class is implementation of the Domain Manifest Strategy.
 */
class DomainManisfestStrategy extends ManifestStrategy {
  /**
   * Generates the domain manifest based on the configuration.
   * @param {object} config - The configuration object.
   * @param {object} context - The context object.
   * @returns {object} The generated domain manifest.
   * @throws {Error} When the domain has an invalid digital certificate ID.
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  generate(config, context) {
    const domain = config?.domain;
    if (!domain) {
      return {};
    }
    if (
      domain.digitalCertificateId &&
      typeof domain.digitalCertificateId === 'string' &&
      domain.digitalCertificateId !== 'lets_encrypt'
    ) {
      throw new Error(
        `Domain ${domain.name} has an invalid digital certificate ID: ${domain.digitalCertificateId}. Only 'lets_encrypt' or null is supported.`,
      );
    }

    if (
      domain.mtls?.verification &&
      domain.mtls.verification !== 'enforce' &&
      domain.mtls.verification !== 'permissive'
    ) {
      throw new Error(
        `Domain ${domain.name} has an invalid verification value: ${domain.mtls.verification}. Only 'enforce' or 'permissive' is supported.`,
      );
    }

    const domainSetting = {
      name: domain.name,
      cname_access_only: domain.cnameAccessOnly || false,
      cnames: domain.cnames || [],
      digital_certificate_id: domain.digitalCertificateId || null,
      edge_application_id: domain.edgeApplicationId || null,
      edge_firewall_id: domain.edgeFirewallId || null,
      active: true,
    };
    if (domain.mtls) {
      domainSetting.is_mtls_enabled = true;
      domainSetting.mtls_verification = domain.mtls.verification;
      domainSetting.mtls_trusted_ca_certificate_id =
        domain.mtls.trustedCaCertificateId;
      domainSetting.crl_list = domain.mtls.crlList || [];
    } else {
      domainSetting.is_mtls_enabled = false;
    }
    return domainSetting;
  }
}

export default DomainManisfestStrategy;
