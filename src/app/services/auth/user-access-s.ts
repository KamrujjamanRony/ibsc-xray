import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserAccessS {
    private accessData: any[] = [
        {
            id: '1',
            name: 'Accounts',
            children: [
                {
                    id: '11',
                    name: 'Bank',
                    children: [
                        { id: '111', name: 'Bank Add', checked: false },
                        { id: '112', name: 'Bank Edit', checked: false },
                        { id: '113', name: 'Bank Delete', checked: false },
                        { id: '114', name: 'Bank List', checked: false },
                    ],
                },
                {
                    id: '12',
                    name: 'Vendor',
                    children: [
                        { id: '121', name: 'Vendor Add', checked: false },
                        { id: '122', name: 'Vendor Edit', checked: false },
                        { id: '123', name: 'Vendor Delete', checked: false },
                        { id: '124', name: 'Vendor List', checked: false },
                    ],
                },
                {
                    id: '13',
                    name: 'Voucher',
                    children: [
                        { id: '131', name: 'Voucher Add', checked: false },
                        { id: '132', name: 'Voucher Edit', checked: false },
                        { id: '133', name: 'Voucher Delete', checked: false },
                        { id: '134', name: 'Voucher List', checked: false },
                    ],
                },
                {
                    id: '14',
                    name: 'ChartOfAccount',
                    children: [
                        { id: '141', name: 'ChartOfAccount Add', checked: false },
                        { id: '142', name: 'ChartOfAccount Edit', checked: false },
                        { id: '143', name: 'ChartOfAccount Delete', checked: false },
                        { id: '144', name: 'ChartOfAccount List', checked: false },
                    ],
                },
                {
                    id: '15',
                    name: 'Account Reports',
                    children: [
                        { id: '151', name: 'Reports Print', checked: false },
                    ],
                },
            ],
        },
        {
            id: '2',
            name: 'User',
            children: [
                { id: '21', name: 'User Add', checked: false },
                { id: '22', name: 'User Edit', checked: false },
                { id: '23', name: 'User Delete', checked: false },
                { id: '24', name: 'User List', checked: false },
            ],
        },
    ];

    getUserAccessTree(): Observable<any[]> {
        return of(this.accessData);
    }
  
}
