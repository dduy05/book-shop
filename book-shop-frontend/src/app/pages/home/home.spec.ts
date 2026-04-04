import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  // Thiết lập môi trường test trước mỗi ca kiểm thử
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent], // Import standalone component
      providers: [
        provideHttpClient(), // Cung cấp HttpClient giả lập cho môi trường test
        provideHttpClientTesting() 
      ]
    })
    .compileComponents();
    
    // Khởi tạo component
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Ca kiểm thử mặc định: Kiểm tra xem component có được tạo thành công không
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});