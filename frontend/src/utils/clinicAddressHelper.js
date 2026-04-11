/**
 * Clinic Address Helper Utility
 * Formats clinic location data into a readable address string
 */

/**
 * Formats clinic location into a complete address string
 * @param {Object} clinic - Clinic object containing location data
 * @param {Object} clinic.location - Location object with address fields
 * @param {string} clinic.location.region - Region name
 * @param {string} clinic.location.district - District name  
 * @param {string} clinic.location.ward - Ward name
 * @param {string} clinic.location.street - Street name
 * @param {string} clinic.address - Fallback address string
 * @returns {string} Formatted address string
 */
export const formatClinicAddress = (clinic) => {
  if (!clinic) return 'Address not available';
  
  const { location, address } = clinic;
  
  // If location has structured address fields, use them
  if (location && (location.region || location.district || location.ward || location.street)) {
    const addressParts = [
      location.street,
      location.ward,
      location.district,
      location.region
    ].filter(Boolean); // Remove empty/null values
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
  }
  
  // Fallback to address field if available
  if (address) {
    return address;
  }
  
  // Final fallback
  return 'Address not available';
};

/**
 * Gets individual address components from clinic location
 * @param {Object} clinic - Clinic object
 * @returns {Object} Object containing individual address components
 */
export const getClinicAddressComponents = (clinic) => {
  if (!clinic) return {
    street: null,
    ward: null,
    district: null,
    region: null,
    fullAddress: 'Address not available'
  };
  
  const { location, address } = clinic;
  
  // If location has structured address fields
  if (location && (location.region || location.district || location.ward || location.street)) {
    return {
      street: location.street || null,
      ward: location.ward || null,
      district: location.district || null,
      region: location.region || null,
      fullAddress: formatClinicAddress(clinic)
    };
  }
  
  // If only address string is available, try to parse it (basic implementation)
  if (address) {
    return {
      street: null,
      ward: null,
      district: null,
      region: null,
      fullAddress: address
    };
  }
  
  return {
    street: null,
    ward: null,
    district: null,
    region: null,
    fullAddress: 'Address not available'
  };
};

/**
 * Gets a short address for display (street, ward max)
 * @param {Object} clinic - Clinic object
 * @returns {string} Short address string
 */
export const getShortClinicAddress = (clinic) => {
  const components = getClinicAddressComponents(clinic);
  
  if (components.street && components.ward) {
    return `${components.street}, ${components.ward}`;
  }
  
  if (components.street) {
    return components.street;
  }
  
  if (components.ward) {
    return components.ward;
  }
  
  return components.fullAddress;
};
