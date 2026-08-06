export type ContactFields = {
  firstname?: string;
  lastname?: string;
  company?: string;
  email: string;
};

export function personalizeHtml(html: string, contact: ContactFields) {
  return html
    .replaceAll("{{firstname}}", contact.firstname || "")
    .replaceAll("{{lastname}}", contact.lastname || "")
    .replaceAll("{{company}}", contact.company || "")
    .replaceAll("{{email}}", contact.email || "")
    .replaceAll("{{first_name}}", contact.firstname || "")
    .replaceAll("{{last_name}}", contact.lastname || "")
    .replaceAll("{{company_name}}", contact.company || "");
}

export function personalizeSubject(subject: string, contact: ContactFields) {
  return personalizeHtml(subject, contact);
}
