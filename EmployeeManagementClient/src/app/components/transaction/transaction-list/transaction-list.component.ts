import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TransactionService } from '../../../services/transaction.service';
import { SuggestionService } from '../../../services/suggestion.service';
import { UserService } from '../../../services/user.service';
import { PassTransaction, ContractorDto } from '../../../models/transaction.model';
import { ApplicationUser } from '../../../models/application-user.model';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap, startWith, map } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { PassService } from '../../../services/pass.service';

@Component({
	selector: 'app-transaction-list',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		ReactiveFormsModule,
		MatAutocompleteModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatCardModule,
		MatGridListModule,
		MatTableModule,
		MatSelectModule,
		MatIconModule,
		MatTooltipModule,
		MatProgressSpinnerModule,
		MatSnackBarModule
	],
	templateUrl: './transaction-list.component.html',
	styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
	searchForm!: FormGroup;
	pageSizeControl = new FormControl(25);
	transactions: PassTransaction[] = [];
	totalItems = 0;
	currentPage = 1;
	pageSize = 25;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	pageSizeOptions = [25, 50, 100];
	isLoading = false;
	isExpanded = true;

	contractorOptions$: Observable<ContractorDto[]> = of([]);
	storeOptions$: Observable<string[]> = of([]);

	allUsers: ApplicationUser[] = [];
	filteredUsers$: Observable<ApplicationUser[]> = of([]);

	constructor(
		private fb: FormBuilder,
		private transactionService: TransactionService,
		private suggestionService: SuggestionService,
		private router: Router,
		private route: ActivatedRoute,
		private cdr: ChangeDetectorRef,
		private authService: AuthService,
		private passService: PassService,
		private userService: UserService,
	) { }

	ngOnInit(): void {
		this.searchForm = this.fb.group({
			storeSearch: [''],
			contractorName: [null],
			userName: ['']
		});

		this.pageSizeControl.valueChanges.subscribe(value => {
			this.pageSize = value || 25;
			this.currentPage = 1;
			this.loadTransactions();
		});

		this.setupAutocomplete();
		this.loadAllUsers();
		this.loadTransactions();
	}

	private setupAutocomplete(): void {
		this.contractorOptions$ = this.searchForm
			.get('contractorName')!
			.valueChanges.pipe(
				distinctUntilChanged(),
				switchMap(value => {
					const searchValue = typeof value === 'string' ? value : (value ? this.displayContractor(value) : '');
					console.log('Contractor search:', searchValue);
					return this.suggestionService.getContractorSuggestions(searchValue || '').pipe(
						tap((options: ContractorDto[]) => console.log('Contractor options:', options)),
						catchError(() => {
							console.log('Error in contractor suggestions');
							return of([] as ContractorDto[]);
						})
					);
				}),
				catchError(() => of([] as ContractorDto[]))
			);

		this.storeOptions$ = this.searchForm
			.get('storeSearch')!
			.valueChanges.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(value => this.suggestionService.getStoreSuggestions(value || '')),
				catchError(() => of([]))
			);

		this.filteredUsers$ = this.searchForm.get('userName')!.valueChanges.pipe(
			startWith(''),
			debounceTime(300),
			distinctUntilChanged(),
			map(value => this._filterUsers(value || ''))
		);
	}

	private loadAllUsers(): void {
		this.userService.getAllUsers().subscribe({
			next: (users) => {
				this.allUsers = users;
				console.log('Loaded all users:', this.allUsers);
			},
			error: (err) => {
				console.error('Ошибка при загрузке всех пользователей:', err);
				this.allUsers = [];
			}
		});
	}

	private _filterUsers(value: string | ApplicationUser): ApplicationUser[] {
		const filterValue = typeof value === 'string' ? value.toLowerCase() : '';

		return this.allUsers.filter(user => {
			const fullName = `${user.lastName || ''} ${user.firstName || ''} ${user.middleName || ''} ${user.userName || ''}`.toLowerCase();
			return fullName.includes(filterValue);
		});
	}

	displayUser(user: ApplicationUser): string {
		if (!user) {
			return '';
		}
		const fullName = `${user.lastName || ''} ${user.firstName || ''} ${user.middleName || ''}`.trim();
		return fullName || user.userName;
	}

	hasRole(role: string): boolean {
		return this.authService.hasRole(role);
	}

	loadTransactions(searchParams?: any): void {
		this.isLoading = true;
		const params = searchParams || this.searchForm.value;
		console.log('Search params being sent:', params);

		this.transactionService
			.searchTransactions(params, this.currentPage, this.pageSize)
			.subscribe({
				next: (result) => {
					this.totalItems = result.total || 0;
					this.transactions = result.transactions && Array.isArray(result.transactions)
						? result.transactions.map((t: PassTransaction) => ({
							...t,
							status: t.status.charAt(0).toUpperCase() + t.status.slice(1).toLowerCase()
						}))
						: [];
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
					this.isLoading = false;
					console.log('Transactions loaded:', this.transactions);
					this.cdr.detectChanges();
				},
				error: (err) => {
					console.error('Ошибка при поиске транзакций:', err);
					this.transactions = [];
					this.totalItems = 0;
					this.totalPages = 0;
					this.isLoading = false;
					this.cdr.detectChanges();
				}
			});
	}

	displayContractor(contractor: ContractorDto): string {
		return contractor ? `${contractor.lastName || ''} ${contractor.firstName || ''} ${contractor.middleName || ''}`.trim() : '';
	}

	getContractorsDisplay(transaction: PassTransaction): string {
		if (transaction.contractorStorePasses && transaction.contractorStorePasses.length > 0) {
			return transaction.contractorStorePasses
				.map(csp => {
					const c = csp.contractor;
					const fullName = `${c.lastName || ''} ${c.firstName || ''} ${c.middleName || ''}`.trim();
					const passport = c.passportSerialNumber || '';
					return `${fullName}${passport ? ', ' + passport : ''}`;
				})
				.join('</br>');
		}
		return 'Нет данных';
	}

	getPassTypesDisplay(transaction: PassTransaction): string {
		if (transaction.contractorStorePasses && transaction.contractorStorePasses.length > 0) {
			return transaction.contractorStorePasses
				.map(csp => {
					const p = csp.passType;
					return `${p.name || ''}, ${p.durationInMonths || 0} месяцев, ${p.cost || 0} руб.`;
				})
				.join('</br>');
		}
		return 'Нет данных';
	}

	getStoresDisplay(transaction: PassTransaction): string {
		if (transaction.contractorStorePasses && transaction.contractorStorePasses.length > 0) {
			return transaction.contractorStorePasses
				.map(csp => {
					const s = csp.store;
					return `${s.building || ''} ${s.floor || ''} ${s.line || ''} ${s.storeNumber || ''}`.trim();
				})
				.join('</br>');
		}
		return 'Нет данных';
	}

	getTotalAmount(): number {
		return this.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const maxVisible = 7;

		if (this.totalPages <= maxVisible) {
			for (let i = 1; i <= this.totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (this.currentPage <= 4) {
				for (let i = 1; i <= 6; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 5; i <= this.totalPages; i++) {
					pages.push(i);
				}
			} else {
				pages.push(1);
				pages.push('...');
				pages.push(this.currentPage - 1);
				pages.push(this.currentPage);
				pages.push(this.currentPage + 1);
				pages.push('...');
				pages.push(this.totalPages);
			}
		}

		this.visiblePages = pages;
	}

	onPageSizeChange(event: any): void {
		const target = event.target as HTMLSelectElement;
		this.pageSize = +target.value;
		this.currentPage = 1;
		this.loadTransactions();
	}


	onPageClick(page: number | string): void {
		if (page === '...') return;
		const pageNumber = page as number;
		if (pageNumber < 1 || pageNumber > this.totalPages) return;
		this.currentPage = pageNumber;
		this.loadTransactions();
	}

	confirmPayment(id: number): void {
		if (!confirm('Подтвердить оплату?')) return;

		this.transactionService.confirmTransaction(id).subscribe({
			next: (response) => {
				alert(response.message);
				this.loadTransactions();
			},
			error: (err) => {
				console.error('Ошибка при подтверждении оплаты:', err);
				alert('Ошибка при подтверждении оплаты: ' + (err.error?.message || 'Неизвестная ошибка'));
			},
		});
	}

	canConfirmPayment(): boolean {
		const userRoles = this.authService.getUserRoles();
		return userRoles.includes('Admin') || userRoles.includes('Cashier');
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	onSearchClick(): void {
		this.currentPage = 1;
		const selectedContractor: ContractorDto | string = this.searchForm.get('contractorName')!.value;
		const selectedUser: ApplicationUser | string = this.searchForm.get('userName')!.value;

		const searchParams = {
			...this.searchForm.value,
			contractorName: typeof selectedContractor === 'string' ? selectedContractor : (selectedContractor ? this.displayContractor(selectedContractor) : ''),
			contractorId: typeof selectedContractor === 'object' && selectedContractor ? selectedContractor.id : null,
			userName: typeof selectedUser === 'object' && selectedUser ? selectedUser.userName : selectedUser
		};
		console.log('Search params before load:', searchParams);
		this.loadTransactions(searchParams);
	}

	onResetFilters(): void {
		this.searchForm.reset({
			storeSearch: '',
			contractorName: null,
			userName: ''
		});
		this.currentPage = 1;
		this.setupAutocomplete();
		this.loadTransactions();
	}

	navigateToDetails(id: number): void {
		this.router.navigate(['/transactions/details', id]);
	}

	getUserFullNameDisplay(transaction: PassTransaction): string {
		const user = transaction.user;
		if (!user) {
			return transaction.userId || 'N/A';
		}

		const lastName = user.lastName || '';
		const firstName = user.firstName || '';
		const middleName = user.middleName || '';
		const userName = user.userName || '';

		let fullNameParts = [];
		if (lastName) fullNameParts.push(lastName);
		if (firstName) fullNameParts.push(firstName);
		if (middleName) fullNameParts.push(middleName);

		const fullName = fullNameParts.join(' ').trim();

		return fullName;
	}
}