import type {Fields,Kind,RecordRow} from './operations';
export function demoRecords():RecordRow[]{
 const result:RecordRow[]=[];
 const add=(kind:Kind,key:string,data:Fields)=>result.push({id:`demo-${kind}-${key}`,hotel_id:'demo-hotel',kind,external_key:key,data,version:1,created_at:'2026-10-10T09:00:00Z',updated_at:'2026-10-10T09:00:00Z'});
 add('room_type','classic',{name:'Classic Double',capacity:2,size_m2:18,beds:'One double bed',features:'Shower, Wi-Fi, air conditioning',description:'A comfortable base for two guests.'});
 add('room_type','superior',{name:'Superior Double',capacity:2,size_m2:24,beds:'One king bed',features:'Bathtub, Wi-Fi, air conditioning',description:'Extra space for a longer stay.'});
 add('room','204',{number:'204',room_type_key:'classic',floor:'2',features:'Courtyard-facing',accessible:false,status:'active'});
 add('room','205',{number:'205',room_type_key:'superior',floor:'2',features:'Street-facing',accessible:false,status:'active'});
 add('reservation','demo-booking',{guest_name:'Camille · fictional guest',channel:'Booking.com',room_type_key:'classic',room_key:'204',arrival:'2026-10-15',departure:'2026-10-18',guests:2,status:'confirmed',notes:'Late arrival requested. Demo data only.'});
 add('conversation','arrival',{guest_name:'Camille · fictional guest',channel:'Booking.com',stage:'booked',reservation_key:'demo-booking',language:'fr',subject:'Late arrival',status:'needs_team'});
 add('conversation','sales',{guest_name:'Alex · fictional prospect',channel:'Booking.com',stage:'pre_booking',reservation_key:'',language:'en',subject:'A quiet room for two',status:'open'});
 add('message','m1',{conversation_key:'arrival',direction:'guest',body:'Nous arrivons vers 23 h. La réception sera-t-elle ouverte ?',sent_at:'2026-10-09T20:00:00Z',delivery:'historical',substantive:true});
 add('message','m2',{conversation_key:'arrival',direction:'hotel',body:'Oui, notre réception est ouverte 24 h/24.',sent_at:'2026-10-09T20:45:00Z',delivery:'historical',substantive:true});
 add('message','m3',{conversation_key:'sales',direction:'guest',body:'We are looking for a quiet room for two. What would you recommend?',sent_at:'2026-10-10T08:00:00Z',delivery:'historical',substantive:true});
 add('knowledge','reception',{title:'Reception hours',body:'Notre réception est ouverte 24 h/24.',language:'fr',scope:'hotel',scope_key:'',expires_at:'',approved:true});
 add('knowledge','quiet',{title:'Room preferences',body:'Courtyard-facing rooms can be requested. A specific room is confirmed only by the reception team, subject to allocation.',language:'en',scope:'hotel',scope_key:'',expires_at:'',approved:true});
 add('team_note','late',{title:'Check late-arrival instructions',body:'Confirm the late-arrival procedure before sharing it with the guest.',conversation_key:'arrival',reservation_key:'demo-booking',status:'open',answer:'',expires_at:''});
 add('review','r1',{channel:'Booking.com',score:8,scale:'10',body:'Friendly reception and a comfortable room. Some street noise.',reviewed_at:'2026-09-22',reservation_key:'',topic:'noise'});
 add('review','r2',{channel:'Booking.com',score:9,scale:'10',body:'Very helpful staff. The room was spotless.',reviewed_at:'2026-10-03',reservation_key:'',topic:'service'});
 add('settings','hotel',{timezone:'Europe/Paris',poll_minutes:10,history_months:'6',reply_mode:'staff_approval',escalation_contact:'Demo reception',sales_policy:'Recommend room types based on verified features. Live price and availability are required before quoting.'});
 return result;
}
