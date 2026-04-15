/**
 * C-08 regression test: trainingService functions must extract .data.data
 * from AxiosResponse, not return raw AxiosResponse objects.
 */
import { trainingService } from '../features/training/services/trainingService';
import api from '../lib/api';

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('trainingService data extraction (C-08)', () => {
  const mockGroups = [{ id: '1', name: 'Group A' }];
  const mockAttendance = { id: 'att-1', attending: true };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getTrainingGroups extracts .data.data, not raw AxiosResponse', async () => {
    mockApi.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { success: true, data: mockGroups },
    });

    const result = await trainingService.getTrainingGroups();

    // Must be the extracted data array, NOT the AxiosResponse wrapper
    expect(result).toEqual(mockGroups);
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('headers');
  });

  it('setAttendance extracts .data.data, not raw AxiosResponse', async () => {
    mockApi.put.mockResolvedValue({
      status: 200,
      headers: {},
      data: { success: true, data: mockAttendance },
    });

    const result = await trainingService.setAttendance('event-1', true);

    expect(result).toEqual(mockAttendance);
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('headers');
  });

  it('getTrainerOverview extracts .data.data', async () => {
    const mockOverview = [{ id: 'training-1', stats: { attending: 5 } }];
    mockApi.get.mockResolvedValue({
      status: 200,
      headers: {},
      data: { success: true, data: mockOverview },
    });

    const result = await trainingService.getTrainerOverview();

    expect(result).toEqual(mockOverview);
    expect(result).not.toHaveProperty('status');
  });
});
