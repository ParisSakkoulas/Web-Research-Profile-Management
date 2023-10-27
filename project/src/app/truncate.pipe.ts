import { Pipe, PipeTransform } from '@angular/core';

// Custom pipe για την απόκρυψη μεγάλων string

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {




  //Μέθοδος για την απόκρυψη string σε ένα συγκεκριμένο μέγεθος
  transform(value: string, args: any[]): string {


    // Αρχικά ελέγχουμε το μέγεθος του args, εάν είναι μεγαλύτερο του 0 τότε το πρώτο στοιχείο το πίνακα μετατρέπεται σε  ακέραιο και εκχωρείται η τιμή στο limit.
    // Διαφορετικά, εκχωρείται η τιμή 20 στη limit.
    const limit = args.length > 0 ? parseInt(args[0], 10) : 20;

    // Αν υπάρχει η δεύτερη παράμετρος τότε εκχωρείται η τιμής της στην trail. Διαφορετικά επιλέγεται η default '...' .
    const trail = args.length > 1 ? args[1] : '...';

    //Τέλος αν το μέγεθος του value είναι μεγαλύτερο του limit επιστρέφεται η τιμή του string κομμένη κατά limit ακολουθούμενη απο το trail. Διαφορετικά επιστρέφεται η τιμή value
    return value.length > limit ? value.substring(0, limit) + trail : value;
  }

}
