
export interface SafetyTip {
  title: string;
  content: string;
  category: 'legal' | 'safety' | 'digital' | 'shelter';
}

export const SAFETY_LIBRARY: SafetyTip[] = [
  {
    title: "Legal Rights Overview",
    category: "legal",
    content: `
# Legal Rights in Domestic Situations

1. **Right to Protection Orders**: You have the right to request a temporary restraining order (TRO) or protection order. This can mandate that the abuser remains a certain distance away.
2. **Right to Safe Harbor**: Discrimination based on your status as a survivor is prohibited in many jurisdictions regarding housing and employment.
3. **Custody and Visitation**: Courts prioritize the safety of the child. Evidence of domestic abuse is a significant factor in custody determinations.
`
  },
  {
    title: "Emergency Escape Checklist",
    category: "safety",
    content: `
# Emergency Escape Checklist

- **Documentation**: Birth certificates, passports, social security cards (for you and children).
- **Financial**: Cash (stashed safely), debit/credit cards, checkbooks.
- **Evidence**: Photos of injuries, printouts of threatening messages, police reports.
- **Personal**: Daily medications, a change of clothes, house/car keys.
- **Safety**: A "burner" phone if possible, or a deactivated old phone (which can still call 911).
`
  },
  {
    title: "Digital Safety Protocol",
    category: "digital",
    content: `
# Securing Your Digital Footprint

1. **Browsing History**: Use Incognito/Private mode. Clear history regularly.
2. **Location Tracking**: Disable "Find My Phone" or Google Location Sharing if the abuser has access to your account.
3. **Password Hygiene**: Change passwords to all essential accounts (Email, Bank, Social Media). Do not use easily guessable PINs.
4. **Spyware Awareness**: If your phone battery drains quickly or behaves unusually, it may have monitoring software installed.
`
  },
  {
    title: "Shelter and Housing Guidance",
    category: "shelter",
    content: `
# Finding Immediate Shelter

- **National Domestic Violence Hotline**: 800-799-7233 (SAFE).
- **Crisis Centers**: Local centers often provide confidential housing for 30-90 days.
- **Relocation Assistance**: Some organizations provide small grants for security deposits or transport to a new city.
`
  },
  {
    title: "Financial Independence Strategy",
    category: "legal",
    content: `
# Financial Safety Planning

1. **Secret Savings**: If possible, start a small cash fund. Store it with a trusted friend or a safe deposit box the abuser cannot access.
2. **Individual Credit**: Try to establish credit in your own name. Apply for a small credit card using a safe mailing address (like a P.O. Box).
3. **Asset Protection**: If you have a joint account, monitor it for large withdrawals. Legal advice is recommended before moving large sums.
4. **Statement Redirection**: Change the delivery address for all financial statements to "Digital Only" or a safe physical location.
`
  },
  {
    title: "Evidence Logging Standards",
    category: "legal",
    content: `
# How to Log Incidents for Court

1. **Timestamps**: Always record the date and exact time of an incident.
2. **Descriptions**: Note what was said and done. Use objective language (e.g., "He slapped my left cheek" rather than "He was mean").
3. **Witnesses**: Record names and contact info of anyone who saw or heard the incident.
4. **Media**: Store photos of injuries or property damage in the **Secure Vault** immediately. 
5. **Medical Records**: If you seek medical attention, ask the provider to "chart" the incident as domestic violence.
`
  },
  {
    title: "Transport and Escape Routes",
    category: "safety",
    content: `
# Safe Transport Planning

- **Public Transit**: Keep a pre-loaded transit card and a map of local routes.
- **Vehicle Prep**: Ensure your car always has at least half a tank of gas. Keep a spare key hidden outside the vehicle or with a neighbor.
- **Rideshare**: Have a rideshare app installed but ensure your "Home" and "Work" addresses are not saved or are set to generic locations nearby.
- **Safe Houses**: Identify at least three locations (24hr businesses, police stations, trusted friends) where you can go at any time.
`
  },
  {
    title: "Safety Planning with Children",
    category: "safety",
    content: `
# Protecting Children During Crisis

1. **Safe Room**: Teach children to stay in a specific room (away from the kitchen or bathroom) if conflict starts.
2. **Code Words**: Establish a secret word that means "leave the house immediately" or "call for help."
3. **Emergency Contact Training**: Ensure children know how to dial emergency services and state their address/location clearly.
4. **School Liaison**: Inform the school counselor or principal of the situation and provide a list of people authorized to pick up the children.
`
  },
  {
    title: "Workplace Safety Strategy",
    category: "safety",
    content: `
# Maintaining Safety at Work

- **Security Notification**: If comfortable, show a photo of the abuser to workplace security or reception.
- **Commute Variation**: Change your route to work daily. Park in well-lit areas or ask a colleague to walk you to your car.
- **Communication Screening**: Ask a trusted coworker to screen your phone calls or emails if the abuser is harassing you at work.
- **HR Support**: Check if your employer offers domestic violence leave or flexible hours to attend legal appointments.
`
  },
  {
    title: "Post-Separation Safety",
    category: "safety",
    content: `
# Safety After Leaving

- **Lock Security**: Change all locks on your new residence immediately. Install deadbolts and outdoor motion-sensor lights.
- **Routine Overhaul**: Avoid the shops, parks, and banks you used to frequent.
- **Digital Guard**: Be extremely cautious with social media. Disable all geo-tagging on photos. Do not post about your location in real-time.
- **Community Alert**: If you have a protection order, keep a copy with you at all times and give one to your local police precinct.
`
  }
];
