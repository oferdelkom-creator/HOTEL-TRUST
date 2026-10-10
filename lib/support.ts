export const guestLanguages=['en','fr','es','it','de','he'] as const;
export type GuestLanguage=typeof guestLanguages[number];
export const languageNames:Record<GuestLanguage,string>={en:'English',fr:'Français',es:'Español',it:'Italiano',de:'Deutsch',he:'עברית'};
export const categories=['general','checkin','housekeeping','maintenance','billing','urgent'] as const;
export type SupportCategory=typeof categories[number];
export type Knowledge={id:string;hotel_id:string;title:string;body:string;language:GuestLanguage;category:SupportCategory;approved:boolean;version:number};
export type GuestRequest={id:string;hotel_id:string;guest_name:string;room:string;body:string;language:GuestLanguage;category:SupportCategory;status:'open'|'in_progress'|'resolved';staff_notes:string;version:number;created_at:string};
export type Connection={id:string;hotel_id:string;provider:string;reference:string;status:'requested'|'closed';created_at:string};
export const providerNames:Record<string,string>={pms:'Property management system (PMS)',booking:'Booking.com / reservation channel',email:'Email',whatsapp:'WhatsApp',fixfix:'FIXFIX · cleaning & maintenance'};
export const handoff:Record<GuestLanguage,string>={en:'The hotel team needs to check this. Please contact reception for assistance.',fr:'L’équipe de l’hôtel doit vérifier ce point. Veuillez contacter la réception.',es:'El equipo del hotel debe comprobarlo. Contacta con recepción para recibir ayuda.',it:'Il personale dell’hotel deve verificare questa richiesta. Contatta la reception.',de:'Das Hotelteam muss dies prüfen. Bitte wenden Sie sich an die Rezeption.',he:'צוות המלון צריך לבדוק את הבקשה. אנא פנו לקבלה לקבלת סיוע.'};
export function previewReply(request:{category:SupportCategory;language:GuestLanguage},knowledge:Knowledge[]){
 // A manual approved-answer preview, not an AI engine or intent classifier.
 const matches=knowledge.filter(k=>k.approved&&k.category===request.category&&k.language===request.language);
 if(['urgent','billing','maintenance','housekeeping'].includes(request.category)||matches.length!==1)return {body:handoff[request.language],source:null,handoff:true};
 return {body:matches[0].body,source:matches[0].title,handoff:false};
}
export function localRedirect(value:string|null){return value?.startsWith('/')&&!value.startsWith('//')&&!value.includes('\\')?value:'/owner';}
